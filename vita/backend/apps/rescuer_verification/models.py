from django.conf import settings
from django.db import models


class RescuerApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        APPROVED = "approved", "Approuvé"
        REJECTED = "rejected", "Refusé"
        REVOKED = "revoked", "Révoqué"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rescuer_applications",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    organization_name = models.CharField(max_length=255, blank=True)
    diploma_type = models.CharField(max_length=64, blank=True)  # PSC1, SST, etc.
    proof_storage_key = models.CharField(max_length=512, blank=True)
    proof_original_name = models.CharField(max_length=255, blank=True)
    reviewer_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
