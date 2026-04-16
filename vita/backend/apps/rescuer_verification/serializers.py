from rest_framework import serializers

from apps.rescuer_verification.models import RescuerApplication


class RescuerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RescuerApplication
        fields = (
            "id",
            "status",
            "organization_name",
            "diploma_type",
            "proof_storage_key",
            "proof_original_name",
            "reviewer_note",
            "created_at",
        )
        read_only_fields = ("id", "status", "reviewer_note", "created_at", "proof_storage_key")
