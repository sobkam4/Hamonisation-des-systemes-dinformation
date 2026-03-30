from django.db.models.signals import post_save, post_delete, pre_save
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import AuditLog, SecurityEvent, SystemLog, DataAccessLog
from django.contrib.auth import get_user_model
import json

User = get_user_model()


@receiver(post_save)
def log_model_changes(sender, instance, created, **kwargs):
    """
    Signal pour logger automatiquement les modifications de modèles
    """
    # Exclure les modèles d'audit eux-mêmes pour éviter les boucles infinies
    if sender in [AuditLog, SecurityEvent, SystemLog, DataAccessLog]:
        return
    
    # Exclure les modèles système Django
    if sender._meta.app_label in ['admin', 'auth', 'contenttypes', 'sessions']:
        return
    
    try:
        # Récupérer l'utilisateur courant depuis le thread local
        from django.contrib.auth import get_user_model
        from django.contrib.auth.middleware import get_user
        from django.utils.functional import SimpleLazyObject
        
        user = None
        if hasattr(instance, '_audit_user'):
            user = instance._audit_user
        elif hasattr(instance, '_current_user'):
            user = instance._current_user
        
        if not user or isinstance(user, SimpleLazyObject):
            return
        
        action_type = 'create' if created else 'update'
        
        # Préparer les changements
        changes = {}
        if not created:
            # Pour les mises à jour, essayer de récupérer les anciennes valeurs
            try:
                old_instance = sender.objects.get(pk=instance.pk)
                changes = get_model_changes(old_instance, instance)
            except sender.DoesNotExist:
                pass
        
        # Créer le log d'audit
        AuditLog.log_action(
            user=user,
            action_type=action_type,
            content_object=instance,
            changes=changes,
            severity='medium' if created else 'low'
        )
        
    except Exception as e:
        # Logger l'erreur mais ne pas interrompre le processus
        SystemLog.log(
            level='ERROR',
            category='audit',
            message=f"Erreur lors de l'audit du modèle {sender.__name__}: {str(e)}",
            module='audit.signals'
        )


@receiver(post_delete)
def log_model_deletion(sender, instance, **kwargs):
    """
    Signal pour logger les suppressions de modèles
    """
    # Exclure les modèles d'audit et modèles système
    if sender in [AuditLog, SecurityEvent, SystemLog, DataAccessLog]:
        return
    if sender._meta.app_label in ['admin', 'auth', 'contenttypes', 'sessions']:
        return
    
    try:
        user = getattr(instance, '_audit_user', None)
        if not user:
            return
        
        AuditLog.log_action(
            user=user,
            action_type='delete',
            content_object=instance,
            severity='high',
            action_details={'deleted_object': str(instance)}
        )
        
    except Exception as e:
        SystemLog.log(
            level='ERROR',
            category='audit',
            message=f"Erreur lors de l'audit de suppression {sender.__name__}: {str(e)}",
            module='audit.signals'
        )


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """
    Signal pour logger les connexions réussies
    """
    try:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        AuditLog.log_action(
            user=user,
            action_type='login',
            ip_address=ip_address,
            user_agent=user_agent,
            session_key=request.session.session_key,
            severity='low'
        )
        
        # Logger l'accès aux données sensibles
        DataAccessLog.objects.create(
            user=user,
            access_type='read',
            data_type='personal_data',
            ip_address=ip_address,
            user_agent=user_agent,
            session_key=request.session.session_key,
            records_count=1
        )
        
    except Exception as e:
        SystemLog.log(
            level='ERROR',
            category='auth',
            message=f"Erreur lors du logging de connexion: {str(e)}",
            module='audit.signals'
        )


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """
    Signal pour logger les déconnexions
    """
    try:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        AuditLog.log_action(
            user=user,
            action_type='logout',
            ip_address=ip_address,
            user_agent=user_agent,
            session_key=request.session.session_key if request.session else '',
            severity='low'
        )
        
    except Exception as e:
        SystemLog.log(
            level='ERROR',
            category='auth',
            message=f"Erreur lors du logging de déconnexion: {str(e)}",
            module='audit.signals'
        )


@receiver(user_login_failed)
def log_failed_login(sender, credentials, request, **kwargs):
    """
    Signal pour logger les échecs de connexion
    """
    try:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        username = credentials.get('username', 'unknown')
        
        # Créer un événement de sécurité
        SecurityEvent.create_event(
            event_type='failed_login',
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Échec de connexion pour l'utilisateur: {username}",
            severity='warning',
            details={
                'username': username,
                'timestamp': timezone.now().isoformat()
            }
        )
        
        # Vérifier s'il y a une attaque par force brute
        check_brute_force_attack(ip_address, username)
        
    except Exception as e:
        SystemLog.log(
            level='ERROR',
            category='auth',
            message=f"Erreur lors du logging d'échec de connexion: {str(e)}",
            module='audit.signals'
        )


def get_client_ip(request):
    """Récupère l'IP réelle du client"""
    try:
        from ipware import get_client_ip
        client_ip, is_routable = get_client_ip(request)
        return client_ip or '0.0.0.0'
    except ImportError:
        return request.META.get('REMOTE_ADDR', '0.0.0.0')


def get_model_changes(old_instance, new_instance):
    """
    Compare deux instances de modèle et retourne les changements
    """
    changes = {}
    
    for field in old_instance._meta.fields:
        field_name = field.name
        old_value = getattr(old_instance, field_name)
        new_value = getattr(new_instance, field_name)
        
        if old_value != new_value:
            changes[field_name] = {
                'old': str(old_value) if old_value is not None else None,
                'new': str(new_value) if new_value is not None else None
            }
    
    return changes


def check_brute_force_attack(ip_address, username):
    """
    Vérifie s'il y a une attaque par force brute
    """
    try:
        from django.utils import timezone
        from datetime import timedelta
        
        # Compter les échecs de connexion récents depuis cette IP
        recent_failures = SecurityEvent.objects.filter(
            event_type='failed_login',
            ip_address=ip_address,
            timestamp__gte=timezone.now() - timedelta(minutes=15)
        ).count()
        
        # Si plus de 5 échecs en 15 minutes, c'est suspect
        if recent_failures >= 5:
            SecurityEvent.create_event(
                event_type='brute_force',
                ip_address=ip_address,
                description=f"Attaque par force brute détectée: {recent_failures} échecs en 15 minutes",
                severity='error',
                details={
                    'failure_count': recent_failures,
                    'target_username': username,
                    'time_window': '15 minutes'
                }
            )
        
        # Vérifier pour un username spécifique
        username_failures = SecurityEvent.objects.filter(
            event_type='failed_login',
            details__username=username,
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        if username_failures >= 10:
            SecurityEvent.create_event(
                event_type='brute_force',
                ip_address=ip_address,
                description=f"Attaque par force brute sur le compte {username}: {username_failures} échecs en 1 heure",
                severity='critical',
                details={
                    'failure_count': username_failures,
                    'target_username': username,
                    'time_window': '1 heure'
                }
            )
            
    except Exception as e:
        SystemLog.log(
            level='ERROR',
            category='security',
            message=f"Erreur lors de la vérification brute force: {str(e)}",
            module='audit.signals'
        )


def set_audit_user(user):
    """
    Définit l'utilisateur pour l'audit dans le contexte courant
    """
    from threading import local
    if not hasattr(set_audit_user, '_thread_local'):
        set_audit_user._thread_local = local()
    set_audit_user._thread_local.user = user


def get_audit_user():
    """
    Récupère l'utilisateur pour l'audit depuis le contexte courant
    """
    from threading import local
    if not hasattr(get_audit_user, '_thread_local'):
        return None
    return getattr(get_audit_user._thread_local, 'user', None)


# Middleware pour définir automatiquement l'utilisateur d'audit
class AuditUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Définir l'utilisateur pour l'audit
        if hasattr(request, 'user') and request.user.is_authenticated:
            set_audit_user(request.user)
        
        response = self.get_response(request)
        
        # Nettoyer le contexte
        if hasattr(get_audit_user, '_thread_local'):
            delattr(get_audit_user._thread_local, 'user')
        
        return response
