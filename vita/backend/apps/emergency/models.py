from django.conf import settings
from django.db import models


class SOSEvent(models.Model):
    class EventType(models.TextChoices):
        MEDICAL = "medical", "Médical"
        FIRE = "fire", "Incendie"
        ACCIDENT = "accident", "Accident"
        OTHER = "other", "Autre"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sos_events",
    )
    event_type = models.CharField(
        max_length=32, choices=EventType.choices, default=EventType.MEDICAL
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    address_text = models.CharField(max_length=500, blank=True)
    notes = models.TextField(blank=True)
    ice_notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
