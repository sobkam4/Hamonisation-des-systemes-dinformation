from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.content.views import BundleViewSet, ProtocolViewSet

router = DefaultRouter()
router.register(r"protocols", ProtocolViewSet, basename="protocol")
router.register(r"bundles", BundleViewSet, basename="bundle")

app_name = "content"

urlpatterns = [
    path("", include(router.urls)),
]
