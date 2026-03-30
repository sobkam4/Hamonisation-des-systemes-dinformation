from rest_framework import serializers


class VitalPassportSerializer(serializers.Serializer):
    organ_donor = serializers.BooleanField(required=False, allow_null=True)
    blood_group = serializers.CharField(required=False, allow_blank=True, default="")
    allergies = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    conditions = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    medications = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    directives = serializers.CharField(required=False, allow_blank=True, default="")
    updated_at = serializers.DateTimeField(read_only=True)

    def to_representation(self, instance):
        p = instance.get_health_payload()
        return {
            "organ_donor": instance.organ_donor,
            "blood_group": p.get("blood_group", ""),
            "allergies": p.get("allergies", []),
            "conditions": p.get("conditions", []),
            "medications": p.get("medications", []),
            "directives": p.get("directives", ""),
            "updated_at": instance.updated_at,
        }
