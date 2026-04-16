from django.conf import settings
from django.db import models


class Course(models.Model):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    locale = models.CharField(max_length=10, default="fr")
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["title"]


class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons")
    order = models.PositiveIntegerField(default=0)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    video_key = models.CharField(max_length=512, blank=True)

    class Meta:
        ordering = ["order", "id"]


class Quiz(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="quizzes", null=True, blank=True
    )
    title = models.CharField(max_length=255)
    pass_score_percent = models.PositiveSmallIntegerField(default=70)

    class Meta:
        verbose_name_plural = "quizzes"


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    order = models.PositiveIntegerField(default=0)
    text = models.TextField()
    explanation = models.TextField(blank=True)

    class Meta:
        ordering = ["order", "id"]


class Answer(models.Model):
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="answers"
    )
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)


class Badge(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)


class UserCourseProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_progress",
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    completed_lesson_ids = models.JSONField(default=list, blank=True)
    last_quiz_score = models.PositiveSmallIntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["user", "course"]]


class QuizAttempt(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_attempts",
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    score_percent = models.PositiveSmallIntegerField()
    answers_json = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class UserBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_badges",
    )
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["user", "badge"]]
