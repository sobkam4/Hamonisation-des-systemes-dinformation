from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.training.models import (
    Answer,
    Badge,
    Course,
    Question,
    Quiz,
    QuizAttempt,
    UserBadge,
    UserCourseProgress,
)
from apps.training.serializers import (
    CourseSerializer,
    QuizSubmitSerializer,
    UserBadgeSerializer,
)


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Course.objects.filter(is_published=True)
    serializer_class = CourseSerializer
    lookup_field = "slug"
    permission_classes = [IsAuthenticated]


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Quiz.objects.all()
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        quiz = self.get_object()
        questions = []
        for q in quiz.questions.all():
            questions.append(
                {
                    "id": q.id,
                    "text": q.text,
                    "answers": [
                        {"id": a.id, "text": a.text} for a in q.answers.all()
                    ],
                }
            )
        return Response({"id": quiz.id, "title": quiz.title, "questions": questions})

    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        quiz = self.get_object()
        ser = QuizSubmitSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        total = 0
        correct = 0
        detail = {}
        for item in ser.validated_data["answers"]:
            qid = item["question_id"]
            aid = item["answer_id"]
            q = Question.objects.filter(id=qid, quiz=quiz).first()
            if not q:
                continue
            total += 1
            ans = Answer.objects.filter(id=aid, question=q).first()
            if ans and ans.is_correct:
                correct += 1
            detail[str(qid)] = bool(ans and ans.is_correct)
        score = int(100 * correct / total) if total else 0
        QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            score_percent=score,
            answers_json=detail,
        )
        if quiz.course_id and score >= quiz.pass_score_percent:
            progress, _ = UserCourseProgress.objects.get_or_create(
                user=request.user, course_id=quiz.course_id
            )
            progress.last_quiz_score = score
            progress.save(update_fields=["last_quiz_score", "updated_at"])
            bronze, _ = Badge.objects.get_or_create(
                slug="bronze", defaults={"name": "Bronze", "description": ""}
            )
            UserBadge.objects.get_or_create(user=request.user, badge=bronze)
        return Response({"score_percent": score, "passed": score >= quiz.pass_score_percent})


class ProgressView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        progress = UserCourseProgress.objects.filter(user=request.user)
        return Response(
            [
                {
                    "course_id": p.course_id,
                    "completed_lesson_ids": p.completed_lesson_ids,
                    "last_quiz_score": p.last_quiz_score,
                }
                for p in progress
            ]
        )

    def post(self, request):
        course_id = request.data.get("course_id")
        lesson_id = request.data.get("lesson_id")
        if not course_id or not lesson_id:
            return Response({"error": "course_id et lesson_id requis"}, status=400)
        p, _ = UserCourseProgress.objects.get_or_create(
            user=request.user, course_id=course_id
        )
        ids = list(p.completed_lesson_ids or [])
        if lesson_id not in ids:
            ids.append(int(lesson_id))
        p.completed_lesson_ids = ids
        p.save(update_fields=["completed_lesson_ids", "updated_at"])
        return Response({"completed_lesson_ids": ids})


class BadgesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserBadgeSerializer

    def get_queryset(self):
        return UserBadge.objects.filter(user=self.request.user).select_related("badge")
