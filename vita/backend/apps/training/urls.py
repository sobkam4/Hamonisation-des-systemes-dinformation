from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.training.views import BadgesView, CourseViewSet, ProgressView, QuizViewSet

router = DefaultRouter()
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"quizzes", QuizViewSet, basename="quiz")

app_name = "training"

urlpatterns = [
    path("progress/", ProgressView.as_view(), name="progress"),
    path("badges/", BadgesView.as_view(), name="badges"),
    path("", include(router.urls)),
]
