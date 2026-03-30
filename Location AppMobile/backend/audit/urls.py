from django.urls import path
from . import views

app_name = 'audit'

urlpatterns = [
    # Logs d'audit
    path('logs/', views.AuditLogListView.as_view(), name='audit-log-list'),
    path('logs/statistics/', views.audit_statistics, name='audit-statistics'),
    path('logs/export/', views.export_audit_logs, name='audit-export'),
    
    # Événements de sécurité
    path('security/', views.SecurityEventListView.as_view(), name='security-event-list'),
    path('security/dashboard/', views.security_dashboard, name='security-dashboard'),
    
    # Logs d'accès aux données
    path('data-access/', views.DataAccessLogListView.as_view(), name='data-access-list'),
    
    # Logs système
    path('system/', views.SystemLogListView.as_view(), name='system-log-list'),
]
