import secrets

from django.conf import settings
from django.db import models


class QrToken(models.Model):
    """Opaque QR token bound to user; rescuer verifies via scan endpoint."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="qr_tokens",
    )
    jti = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @staticmethod
    def new_jti() -> str:
        return secrets.token_urlsafe(32)


class QrScanLog(models.Model):
    rescuer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="qr_scans",
    )
    subject_user_id = models.PositiveBigIntegerField(db_index=True)
    success = models.BooleanField(default=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
