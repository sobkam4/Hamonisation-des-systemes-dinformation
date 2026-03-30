from rest_framework import serializers

from apps.emergency.models import SOSEvent


class SOSEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SOSEvent
        fields = (
            "id",
            "event_type",
            "latitude",
            "longitude",
            "address_text",
            "notes",
            "ice_notified",
            "created_at",
        )
        read_only_fields = ("id", "ice_notified", "created_at")
