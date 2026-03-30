from django.contrib import admin

from apps.rescuer_verification.models import RescuerApplication


@admin.register(RescuerApplication)
class RescuerApplicationAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "diploma_type", "created_at")
    list_filter = ("status",)
    raw_id_fields = ("user",)
