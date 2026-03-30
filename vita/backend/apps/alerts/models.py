from django.db import models


class GeoAlert(models.Model):
    class AlertKind(models.TextChoices):
        WEATHER = "weather", "Météo"
        EARTHQUAKE = "earthquake", "Séisme"
        FLOOD = "flood", "Inondation"
        OTHER = "other", "Autre"

    kind = models.CharField(max_length=32, choices=AlertKind.choices)
    title = models.CharField(max_length=255)
    body = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    radius_km = models.DecimalField(max_digits=8, decimal_places=2, default=10)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-starts_at"]
