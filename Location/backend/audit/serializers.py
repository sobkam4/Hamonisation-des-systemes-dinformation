from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import AuditLog, SecurityEvent, SystemLog, DataAccessLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer pour les logs d'audit"""
    user_info = serializers.SerializerMethodField()
    content_type_info = serializers.SerializerMethodField()
    action_description = serializers.CharField(read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_info', 'action_type', 'severity',
            'content_type', 'content_type_info', 'object_id',
            'object_repr', 'action_description', 'ip_address',
            'user_agent', 'request_id', 'action_details',
            'changes', 'timestamp', 'session_key'
        ]
        read_only_fields = ['timestamp']
    
    @extend_schema_field(serializers.JSONField(allow_null=True))
    def get_user_info(self, obj):
        """Retourne les informations de l'utilisateur"""
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'role': obj.user.role
            }
        return None
    
    @extend_schema_field(serializers.JSONField(allow_null=True))
    def get_content_type_info(self, obj):
        """Retourne les informations du type de contenu"""
        if obj.content_type:
            return {
                'app_label': obj.content_type.app_label,
                'model': obj.content_type.model
            }
        return None


class SecurityEventSerializer(serializers.ModelSerializer):
    """Serializer pour les événements de sécurité"""
    user_info = serializers.SerializerMethodField()
    resolved_by_info = serializers.SerializerMethodField()
    
    class Meta:
        model = SecurityEvent
        fields = [
            'id', 'user', 'user_info', 'event_type', 'severity',
            'status', 'ip_address', 'user_agent', 'request_details',
            'description', 'details', 'resolution_notes',
            'timestamp', 'resolved_at', 'resolved_by', 'resolved_by_info'
        ]
        read_only_fields = ['timestamp', 'resolved_at', 'resolved_by']
    
    @extend_schema_field(serializers.JSONField(allow_null=True))
    def get_user_info(self, obj):
        """Retourne les informations de l'utilisateur concerné"""
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'role': obj.user.role
            }
        return None
    
    @extend_schema_field(serializers.JSONField(allow_null=True))
    def get_resolved_by_info(self, obj):
        """Retourne les informations de l'utilisateur qui a résolu"""
        if obj.resolved_by:
            return {
                'id': obj.resolved_by.id,
                'username': obj.resolved_by.username,
                'email': obj.resolved_by.email,
                'role': obj.resolved_by.role
            }
        return None


class SystemLogSerializer(serializers.ModelSerializer):
    """Serializer pour les logs système"""
    user_info = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemLog
        fields = [
            'id', 'level', 'category', 'message', 'details',
            'module', 'function', 'line_number', 'timestamp',
            'request_id', 'user', 'user_info'
        ]
        read_only_fields = ['timestamp']
    
    @extend_schema_field(serializers.JSONField(allow_null=True))
    def get_user_info(self, obj):
        """Retourne les informations de l'utilisateur"""
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'role': obj.user.role
            }
        return None


class DataAccessLogSerializer(serializers.ModelSerializer):
    """Serializer pour les logs d'accès aux données"""
    user_info = serializers.SerializerMethodField()
    
    class Meta:
        model = DataAccessLog
        fields = [
            'id', 'user', 'user_info', 'access_type', 'data_type',
            'ip_address', 'user_agent', 'records_count',
            'query_details', 'export_format', 'timestamp',
            'session_key'
        ]
        read_only_fields = ['timestamp']
    
    @extend_schema_field(serializers.JSONField(allow_null=True))
    def get_user_info(self, obj):
        """Retourne les informations de l'utilisateur"""
        if not obj.user:
            return None
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email,
            'role': obj.user.role
        }


class AuditStatisticsSerializer(serializers.Serializer):
    """Serializer pour les statistiques d'audit"""
    total_logs = serializers.IntegerField()
    by_action_type = serializers.DictField()
    by_severity = serializers.DictField()
    recent_activity = serializers.IntegerField()
    today_activity = serializers.IntegerField()
    hourly_activity = serializers.ListField(child=serializers.DictField())
    top_users = serializers.ListField(child=serializers.DictField(), required=False)


class SecurityDashboardSerializer(serializers.Serializer):
    """Serializer pour le tableau de bord de sécurité"""
    total_events = serializers.IntegerField()
    by_type = serializers.DictField()
    by_severity = serializers.DictField()
    by_status = serializers.DictField()
    recent_events = serializers.IntegerField()
    critical_events = serializers.IntegerField()
    recent_events_list = SecurityEventSerializer(many=True)
    suspicious_ips = serializers.ListField(child=serializers.DictField())
