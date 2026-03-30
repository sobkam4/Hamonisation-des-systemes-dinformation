from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import AuditLog, SecurityEvent, SystemLog, DataAccessLog
from .serializers import (
    AuditLogSerializer, SecurityEventSerializer, 
    SystemLogSerializer, DataAccessLogSerializer
)
import json

User = get_user_model()


@extend_schema(
    tags=['Audit'],
    summary="Lister les logs d'audit",
    description="Retourne la liste des logs d'audit avec filtrage",
    parameters=[
        OpenApiParameter(
            name='action_type',
            type=str,
            enum=['create', 'update', 'delete', 'view', 'login', 'logout'],
            description='Filtrer par type d\'action'
        ),
        OpenApiParameter(
            name='severity',
            type=str,
            enum=['low', 'medium', 'high', 'critical'],
            description='Filtrer par niveau de sévérité'
        ),
        OpenApiParameter(
            name='user_id',
            type=int,
            description='Filtrer par utilisateur'
        ),
        OpenApiParameter(
            name='date_from',
            type=str,
            description='Date de début (YYYY-MM-DD)'
        ),
        OpenApiParameter(
            name='date_to',
            type=str,
            description='Date de fin (YYYY-MM-DD)'
        )
    ]
)
class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = AuditLog.objects.select_related('user').order_by('-timestamp')
        
        # Filtrage par utilisateur
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filtrage par type d'action
        action_type = self.request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filtrage par sévérité
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filtrage par date
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)
        
        # Les utilisateurs non-admin ne voient que leurs propres logs
        if not self.request.user.is_superuser:
            queryset = queryset.filter(user=self.request.user)
        
        return queryset


@extend_schema(
    tags=['Audit'],
    summary="Statistiques d'audit",
    description="Retourne les statistiques détaillées des logs d'audit"
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def audit_statistics(request):
    """Retourne les statistiques des logs d'audit"""
    
    # Base queryset selon les permissions
    if request.user.is_superuser:
        base_queryset = AuditLog.objects.all()
    else:
        base_queryset = AuditLog.objects.filter(user=request.user)
    
    # Statistiques générales
    stats = {
        'total_logs': base_queryset.count(),
        'by_action_type': dict(
            base_queryset.values('action_type')
            .annotate(count=Count('id'))
            .values_list('action_type', 'count')
        ),
        'by_severity': dict(
            base_queryset.values('severity')
            .annotate(count=Count('id'))
            .values_list('severity', 'count')
        ),
        'recent_activity': (
            base_queryset
            .filter(timestamp__gte=timezone.now() - timezone.timedelta(days=7))
            .count()
        ),
        'today_activity': (
            base_queryset
            .filter(timestamp__date=timezone.now().date())
            .count()
        )
    }
    
    # Activité par heure (24 dernières heures)
    hourly_activity = []
    for i in range(24):
        hour = timezone.now() - timezone.timedelta(hours=i)
        count = base_queryset.filter(
            timestamp__hour=hour.hour,
            timestamp__date=hour.date()
        ).count()
        hourly_activity.append({
            'hour': hour.hour,
            'count': count
        })
    
    stats['hourly_activity'] = list(reversed(hourly_activity))
    
    # Top utilisateurs (superadmin seulement)
    if request.user.is_superuser:
        stats['top_users'] = list(
            base_queryset.values('user__username')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
            .values('user__username', 'count')
        )
    
    return Response(stats)


@extend_schema(
    tags=['Sécurité'],
    summary="Lister les événements de sécurité",
    description="Retourne la liste des événements de sécurité"
)
class SecurityEventListView(generics.ListAPIView):
    serializer_class = SecurityEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = SecurityEvent.objects.select_related('user', 'resolved_by').order_by('-timestamp')
        
        # Filtrage par type d'événement
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Filtrage par sévérité
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filtrage par statut
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


@extend_schema(
    tags=['Sécurité'],
    summary="Tableau de bord de sécurité",
    description="Retourne les statistiques de sécurité"
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def security_dashboard(request):
    """Tableau de bord de sécurité"""
    
    # Statistiques des événements
    stats = {
        'total_events': SecurityEvent.objects.count(),
        'by_type': dict(
            SecurityEvent.objects.values('event_type')
            .annotate(count=Count('id'))
            .values_list('event_type', 'count')
        ),
        'by_severity': dict(
            SecurityEvent.objects.values('severity')
            .annotate(count=Count('id'))
            .values_list('severity', 'count')
        ),
        'by_status': dict(
            SecurityEvent.objects.values('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        ),
        'recent_events': SecurityEvent.objects.filter(
            timestamp__gte=timezone.now() - timezone.timedelta(days=7)
        ).count(),
        'critical_events': SecurityEvent.objects.filter(
            severity='critical',
            status__in=['new', 'investigating']
        ).count()
    }
    
    # Événements récents
    recent_events = SecurityEvent.objects.filter(
        timestamp__gte=timezone.now() - timezone.timedelta(hours=24)
    ).order_by('-timestamp')[:10]
    
    stats['recent_events_list'] = SecurityEventSerializer(recent_events, many=True).data
    
    # IPs suspectes
    suspicious_ips = (
        SecurityEvent.objects
        .values('ip_address')
        .annotate(count=Count('id'))
        .filter(count__gte=5)
        .order_by('-count')[:10]
    )
    
    stats['suspicious_ips'] = list(suspicious_ips)
    
    return Response(stats)


@extend_schema(
    tags=['Audit'],
    summary="Logs d'accès aux données",
    description="Retourne les logs d'accès aux données sensibles"
)
class DataAccessLogListView(generics.ListAPIView):
    serializer_class = DataAccessLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = DataAccessLog.objects.select_related('user').order_by('-timestamp')
        
        # Filtrage par utilisateur
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filtrage par type d'accès
        access_type = self.request.query_params.get('access_type')
        if access_type:
            queryset = queryset.filter(access_type=access_type)
        
        # Filtrage par type de données
        data_type = self.request.query_params.get('data_type')
        if data_type:
            queryset = queryset.filter(data_type=data_type)
        
        # Les utilisateurs ne voient que leurs propres accès
        if not self.request.user.is_superuser:
            queryset = queryset.filter(user=self.request.user)
        
        return queryset


@extend_schema(
    tags=['Système'],
    summary="Logs système",
    description="Retourne les logs système avec filtrage"
)
class SystemLogListView(generics.ListAPIView):
    serializer_class = SystemLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = SystemLog.objects.select_related('user').order_by('-timestamp')
        
        # Filtrage par niveau
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)
        
        # Filtrage par catégorie
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filtrage par module
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module__icontains=module)
        
        return queryset


@extend_schema(
    tags=['Audit'],
    summary="Exporter les logs d'audit",
    description="Exporte les logs d'audit au format CSV"
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_audit_logs(request):
    """Exporte les logs d'audit"""
    
    import csv
    from django.http import HttpResponse
    
    # Récupérer les logs selon les permissions
    if request.user.is_superuser:
        logs = AuditLog.objects.select_related('user').order_by('-timestamp')
    else:
        logs = AuditLog.objects.filter(user=request.user).order_by('-timestamp')
    
    # Appliquer les filtres
    action_type = request.query_params.get('action_type')
    if action_type:
        logs = logs.filter(action_type=action_type)
    
    severity = request.query_params.get('severity')
    if severity:
        logs = logs.filter(severity=severity)
    
    date_from = request.query_params.get('date_from')
    if date_from:
        logs = logs.filter(timestamp__date__gte=date_from)
    
    date_to = request.query_params.get('date_to')
    if date_to:
        logs = logs.filter(timestamp__date__lte=date_to)
    
    # Logger l'export
    DataAccessLog.objects.create(
        user=request.user,
        access_type='export',
        data_type='audit_data',
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        records_count=logs.count(),
        export_format='csv'
    )
    
    # Créer la réponse CSV
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="audit_logs_{timezone.now().date()}.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'Timestamp', 'User', 'Action', 'Severity', 'Object Type',
        'Object ID', 'Object Representation', 'IP Address',
        'User Agent', 'Changes'
    ])
    
    for log in logs:
        writer.writerow([
            log.timestamp,
            log.user.username if log.user else 'Anonymous',
            log.action_type,
            log.severity,
            log.content_type.model if log.content_type else '',
            log.object_id,
            log.object_repr,
            log.ip_address,
            log.user_agent,
            json.dumps(log.changes)
        ])
    
    return response


def get_client_ip(request):
    """Récupère l'IP réelle du client"""
    try:
        from ipware import get_client_ip
        client_ip, is_routable = get_client_ip(request)
        return client_ip or '0.0.0.0'
    except ImportError:
        return request.META.get('REMOTE_ADDR', '0.0.0.0')
