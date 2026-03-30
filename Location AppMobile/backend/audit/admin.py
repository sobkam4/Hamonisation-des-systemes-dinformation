from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import AuditLog, SecurityEvent, SystemLog, DataAccessLog
import json
from auditlog.registry import auditlog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'user', 'action_type', 'object_repr', 
        'ip_address', 'severity_badge'
    ]
    list_filter = [
        'action_type', 'severity', 'timestamp', 'user',
        'content_type'
    ]
    search_fields = [
        'user__username', 'user__email', 'object_repr', 
        'ip_address', 'action_details'
    ]
    readonly_fields = [
        'timestamp', 'user', 'action_type', 'severity',
        'content_type', 'object_id', 'ip_address', 
        'user_agent', 'request_id', 'object_repr',
        'action_details', 'changes', 'session_key'
    ]
    
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Informations générales', {
            'fields': (
                'timestamp', 'user', 'action_type', 'severity',
                'session_key', 'request_id'
            )
        }),
        ('Objet concerné', {
            'fields': (
                'content_type', 'object_id', 'object_repr'
            )
        }),
        ('Informations de requête', {
            'fields': (
                'ip_address', 'user_agent'
            )
        }),
        ('Détails de l\'action', {
            'fields': (
                'action_details', 'changes'
            )
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
    
    def severity_badge(self, obj):
        colors = {
            'low': 'green',
            'medium': 'orange',
            'high': 'red',
            'critical': 'darkred'
        }
        color = colors.get(obj.severity, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px;">{}</span>',
            color, obj.get_severity_display()
        )
    severity_badge.short_description = 'Sévérité'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            # Les utilisateurs ne voient que leurs propres logs
            qs = qs.filter(user=request.user)
        return qs


@admin.register(SecurityEvent)
class SecurityEventAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'event_type', 'ip_address', 
        'severity_badge', 'status_badge', 'user'
    ]
    list_filter = [
        'event_type', 'severity', 'status', 'timestamp', 'user'
    ]
    search_fields = [
        'ip_address', 'description', 'user__username', 
        'user__email'
    ]
    readonly_fields = [
        'timestamp', 'event_type', 'severity', 'ip_address',
        'user_agent', 'request_details', 'user', 'details'
    ]
    
    fieldsets = (
        ('Informations générales', {
            'fields': (
                'timestamp', 'event_type', 'severity'
            )
        }),
        ('Utilisateur concerné', {
            'fields': ('user',)
        }),
        ('Informations de requête', {
            'fields': (
                'ip_address', 'user_agent', 'request_details'
            )
        }),
        ('Description et détails', {
            'fields': (
                'description', 'details'
            )
        }),
        ('Résolution', {
            'fields': (
                'status', 'resolved_at', 'resolved_by', 'resolution_notes'
            )
        }),
    )
    
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    def severity_badge(self, obj):
        colors = {
            'info': 'blue',
            'warning': 'orange',
            'error': 'red',
            'critical': 'darkred'
        }
        color = colors.get(obj.severity, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px;">{}</span>',
            color, obj.get_severity_display()
        )
    severity_badge.short_description = 'Sévérité'
    
    def status_badge(self, obj):
        colors = {
            'new': 'red',
            'investigating': 'orange',
            'resolved': 'green',
            'false_positive': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Statut'
    
    def mark_as_resolved(self, request, queryset):
        updated = queryset.update(
            status='resolved',
            resolved_at=timezone.now(),
            resolved_by=request.user
        )
        self.message_user(request, f'{updated} événements marqués comme résolus.')
    mark_as_resolved.short_description = 'Marquer comme résolu'
    
    def mark_as_false_positive(self, request, queryset):
        updated = queryset.update(status='false_positive')
        self.message_user(request, f'{updated} événements marqués comme faux positifs.')
    mark_as_false_positive.short_description = 'Marquer comme faux positif'


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'level_badge', 'category', 'message_short',
        'module', 'user'
    ]
    list_filter = [
        'level', 'category', 'timestamp', 'module', 'user'
    ]
    search_fields = [
        'message', 'module', 'function', 'user__username'
    ]
    readonly_fields = [
        'timestamp', 'level', 'category', 'message', 'details',
        'module', 'function', 'line_number', 'request_id', 'user'
    ]
    
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Informations générales', {
            'fields': (
                'timestamp', 'level', 'category', 'user'
            )
        }),
        ('Message et contexte', {
            'fields': (
                'message', 'module', 'function', 'line_number'
            )
        }),
        ('Détails techniques', {
            'fields': (
                'details', 'request_id'
            )
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
    
    def level_badge(self, obj):
        colors = {
            'DEBUG': 'gray',
            'INFO': 'blue',
            'WARNING': 'orange',
            'ERROR': 'red',
            'CRITICAL': 'darkred'
        }
        color = colors.get(obj.level, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px;">{}</span>',
            color, obj.level
        )
    level_badge.short_description = 'Niveau'
    
    def message_short(self, obj):
        return obj.message[:100] + '...' if len(obj.message) > 100 else obj.message
    message_short.short_description = 'Message'


@admin.register(DataAccessLog)
class DataAccessLogAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'user', 'access_type', 'data_type',
        'records_count', 'ip_address'
    ]
    list_filter = [
        'access_type', 'data_type', 'timestamp', 'user'
    ]
    search_fields = [
        'user__username', 'user__email', 'ip_address'
    ]
    readonly_fields = [
        'timestamp', 'user', 'access_type', 'data_type',
        'ip_address', 'user_agent', 'records_count',
        'query_details', 'export_format', 'session_key'
    ]
    
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Informations générales', {
            'fields': (
                'timestamp', 'user', 'access_type', 'data_type'
            )
        }),
        ('Informations d\'accès', {
            'fields': (
                'ip_address', 'user_agent', 'session_key'
            )
        }),
        ('Détails de l\'accès', {
            'fields': (
                'records_count', 'query_details', 'export_format'
            )
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


# Exclure SecurityEvent du tracking django-auditlog pour éviter les erreurs avec changes_text
try:
    auditlog.unregister(SecurityEvent)
except:
    pass  # Le modèle n'est peut-être pas encore enregistré

# Configuration du site d'administration
admin.site.site_header = 'Administration ERP Location'
admin.site.site_title = 'ERP Location'
admin.site.index_title = 'Tableau de bord d\'administration'
