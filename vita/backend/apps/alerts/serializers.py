from rest_framework import serializers

from apps.alerts.models import GeoAlert


class GeoAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeoAlert
        fields = (
            "id",
            "kind",
            "title",
            "body",
            "latitude",
            "longitude",
            "radius_km",
            "starts_at",
            "ends_at",
        )
