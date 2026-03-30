from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.enterprise.views import FirstAidKitViewSet, OrganizationViewSet, WorkIncidentViewSet

router = DefaultRouter()
router.register(r"orgs", OrganizationViewSet, basename="org")
router.register(r"incidents", WorkIncidentViewSet, basename="incident")
router.register(r"first-aid", FirstAidKitViewSet, basename="firstaid")

app_name = "enterprise"

urlpatterns = [path("", include(router.urls))]
