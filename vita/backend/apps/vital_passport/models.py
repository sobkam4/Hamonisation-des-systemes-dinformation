import json

from django.conf import settings
from django.db import models

from apps.vital_passport.crypto import decrypt_field, encrypt_field


class VitalPassport(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vital_passport",
    )
    payload_encrypted = models.TextField(blank=True)
    organ_donor = models.BooleanField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_health_payload(self, data: dict) -> None:
        self.payload_encrypted = encrypt_field(json.dumps(data, ensure_ascii=False))

    def get_health_payload(self) -> dict:
        if not self.payload_encrypted:
            return {}
        raw = decrypt_field(self.payload_encrypted)
        if not raw:
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}

    def snapshot_for_rescuer(self) -> dict:
        """Minimal fields for emergency (scope)."""
        p = self.get_health_payload()
        return {
            "blood_group": p.get("blood_group"),
            "allergies": p.get("allergies"),
            "conditions": p.get("conditions"),
            "medications": p.get("medications"),
            "organ_donor": self.organ_donor,
        }
