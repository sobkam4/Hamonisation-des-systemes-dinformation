from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['titre', 'user', 'type_notification', 'priorite', 'lu', 'date_creation']
    list_filter = ['type_notification', 'priorite', 'lu', 'date_creation']
    search_fields = ['titre', 'message', 'user__username']
    readonly_fields = ['date_creation', 'date_lecture']
    ordering = ['-date_creation']
