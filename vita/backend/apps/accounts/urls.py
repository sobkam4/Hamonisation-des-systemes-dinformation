from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import ICEContactViewSet, MeView

router = DefaultRouter()
router.register(r"ice-contacts", ICEContactViewSet, basename="ice")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
