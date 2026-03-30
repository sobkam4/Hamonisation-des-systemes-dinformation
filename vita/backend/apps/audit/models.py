from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """Immutable-style audit trail for sensitive actions."""

    class Action(models.TextChoices):
        PASSPORT_READ = "passport_read", "Lecture passeport"
        PASSPORT_UPDATE = "passport_update", "Mise à jour passeport"
        QR_SCAN = "qr_scan", "Scan QR"
        RESCUER_APPROVE = "rescuer_approve", "Approbation secouriste"
        ADMIN_ACTION = "admin_action", "Action admin"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_actions",
    )
    action = models.CharField(max_length=64, choices=Action.choices, db_index=True)
    target_type = models.CharField(max_length=64, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["action", "-created_at"]),
        ]
