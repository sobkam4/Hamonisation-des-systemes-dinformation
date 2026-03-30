from rest_framework import serializers

from apps.training.models import (
    Course,
    Lesson,
    UserBadge,
)


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ("id", "order", "title", "body", "video_key")


class CourseSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ("id", "slug", "title", "description", "locale", "lessons")


class AnswerWriteSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    answer_id = serializers.IntegerField()


class QuizSubmitSerializer(serializers.Serializer):
    answers = AnswerWriteSerializer(many=True)


class UserBadgeSerializer(serializers.ModelSerializer):
    badge_slug = serializers.CharField(source="badge.slug", read_only=True)
    badge_name = serializers.CharField(source="badge.name", read_only=True)

    class Meta:
        model = UserBadge
        fields = ("badge_slug", "badge_name", "earned_at")
