from rest_framework import mixins, viewsets

from apps.emergency.models import SOSEvent
from apps.emergency.serializers import SOSEventSerializer
from apps.emergency.tasks import notify_ice_for_sos


class SOSEventViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = SOSEventSerializer

    def get_queryset(self):
        return SOSEvent.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        ev = serializer.save(user=self.request.user)
        notify_ice_for_sos.delay(ev.id)
