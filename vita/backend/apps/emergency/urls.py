from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.emergency.views import SOSEventViewSet

router = DefaultRouter()
router.register(r"sos", SOSEventViewSet, basename="sos")

app_name = "emergency"

urlpatterns = [path("", include(router.urls))]
