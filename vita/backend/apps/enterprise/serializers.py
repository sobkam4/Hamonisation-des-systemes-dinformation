from rest_framework import serializers

from apps.enterprise.models import FirstAidKitItem, Organization, WorkIncident


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "created_at")


class WorkIncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkIncident
        fields = (
            "id",
            "org",
            "title",
            "description",
            "occurred_at",
            "location",
            "attachment_keys",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class FirstAidKitItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FirstAidKitItem
        fields = (
            "id",
            "org",
            "name",
            "location_label",
            "expiry_date",
            "last_checked_at",
        )
