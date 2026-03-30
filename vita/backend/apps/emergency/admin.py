from django.contrib import admin

from apps.emergency.models import SOSEvent


@admin.register(SOSEvent)
class SOSEventAdmin(admin.ModelAdmin):
    list_display = ("user", "event_type", "created_at", "ice_notified")
    list_filter = ("event_type",)
    raw_id_fields = ("user",)
