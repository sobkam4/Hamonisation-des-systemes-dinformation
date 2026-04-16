from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.enterprise.models import FirstAidKitItem, Organization, OrganizationMember, WorkIncident
from apps.enterprise.serializers import (
    FirstAidKitItemSerializer,
    OrganizationSerializer,
    WorkIncidentSerializer,
)


class OrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_ids = OrganizationMember.objects.filter(
            user=self.request.user
        ).values_list("org_id", flat=True)
        return Organization.objects.filter(id__in=org_ids)


class WorkIncidentViewSet(viewsets.ModelViewSet):
    serializer_class = WorkIncidentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_ids = OrganizationMember.objects.filter(
            user=self.request.user
        ).values_list("org_id", flat=True)
        return WorkIncident.objects.filter(org_id__in=org_ids)

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class FirstAidKitViewSet(viewsets.ModelViewSet):
    serializer_class = FirstAidKitItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_ids = OrganizationMember.objects.filter(
            user=self.request.user
        ).values_list("org_id", flat=True)
        return FirstAidKitItem.objects.filter(org_id__in=org_ids)
