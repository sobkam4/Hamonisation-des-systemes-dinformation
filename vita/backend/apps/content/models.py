from django.db import models


class Category(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=200)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["sort_order", "name"]


class MediaAsset(models.Model):
    storage_key = models.CharField(max_length=512)
    mime_type = models.CharField(max_length=128, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Protocol(models.Model):
    slug = models.SlugField(db_index=True)
    title = models.CharField(max_length=255)
    locale = models.CharField(max_length=10, default="fr")
    version = models.PositiveIntegerField(default=1)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="protocols"
    )
    summary = models.TextField(blank=True)
    is_published = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["slug", "locale", "version"]]
        ordering = ["title"]


class ProtocolStep(models.Model):
    protocol = models.ForeignKey(
        Protocol, on_delete=models.CASCADE, related_name="steps"
    )
    order = models.PositiveIntegerField(default=0)
    title = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    audio_text = models.TextField(blank=True)
    image = models.ForeignKey(
        MediaAsset, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        ordering = ["order", "id"]


class ContentBundle(models.Model):
    """Versioned offline bundle manifest."""

    version = models.CharField(max_length=32, unique=True)
    locale = models.CharField(max_length=10, default="fr")
    manifest_json = models.JSONField()
    storage_key = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
