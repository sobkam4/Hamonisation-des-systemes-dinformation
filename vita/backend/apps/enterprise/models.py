from django.conf import settings
from django.db import models


class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class OrganizationMember(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Membre"
        RESCUER = "rescuer", "Secouriste interne"

    org = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="org_memberships",
    )
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["org", "user"]]


class WorkIncident(models.Model):
    org = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="incidents"
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reported_incidents",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    occurred_at = models.DateTimeField()
    location = models.CharField(max_length=500, blank=True)
    attachment_keys = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-occurred_at"]


class FirstAidKitItem(models.Model):
    org = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="first_aid_items"
    )
    name = models.CharField(max_length=255)
    location_label = models.CharField(max_length=255, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    last_checked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["expiry_date", "name"]
