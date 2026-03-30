from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
import json

User = get_user_model()

class AuditLog(models.Model):
    """
    Modèle pour l'audit des actions sur les objets
    """
    
    ACTION_TYPES = [
        ('create', 'Création'),
        ('update', 'Modification'),
        ('delete', 'Suppression'),
        ('view', 'Consultation'),
        ('login', 'Connexion'),
        ('logout', 'Déconnexion'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('print', 'Impression'),
        ('email', 'Email envoyé'),
        ('payment', 'Paiement'),
        ('contract_sign', 'Signature contrat'),
        ('contract_terminate', 'Résiliation contrat'),
    ]
    
    SEVERITY_LEVELS = [
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Élevé'),
        ('critical', 'Critique'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_logs',
        verbose_name='Utilisateur'
    )
    action_type = models.CharField(
        max_length=20, 
        choices=ACTION_TYPES,
        verbose_name='Type d\'action'
    )
    severity = models.CharField(
        max_length=10, 
        choices=SEVERITY_LEVELS,
        default='low',
        verbose_name='Niveau de sévérité'
    )
    
    # Generic relation pour tracer n'importe quel objet
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Informations sur la requête
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        verbose_name='Adresse IP'
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent'
    )
    request_id = models.CharField(
        max_length=36,
        blank=True,
        verbose_name='ID de requête'
    )
    
    # Détails de l'action
    object_repr = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Représentation de l\'objet'
    )
    action_details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Détails de l\'action'
    )
    changes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Changements effectués'
    )
    
    # Métadonnées
    timestamp = models.DateTimeField(
        default=timezone.now,
        verbose_name='Horodatage'
    )
    session_key = models.CharField(
        max_length=40,
        blank=True,
        verbose_name='Clé de session'
    )
    
    class Meta:
        verbose_name = 'Log d\'audit'
        verbose_name_plural = 'Logs d\'audit'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action_type']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        user_str = f"{self.user}" if self.user else "Anonymous"
        return f"{user_str} - {self.get_action_type_display()} - {self.timestamp}"
    
    @property
    def action_description(self):
        """Description détaillée de l'action"""
        if self.action_type == 'create':
            return f"Création de {self.object_repr}"
        elif self.action_type == 'update':
            return f"Modification de {self.object_repr}"
        elif self.action_type == 'delete':
            return f"Suppression de {self.object_repr}"
        elif self.action_type == 'login':
            return f"Connexion de {self.user}"
        elif self.action_type == 'logout':
            return f"Déconnexion de {self.user}"
        return f"{self.get_action_type_display()} - {self.object_repr}"
    
    @classmethod
    def log_action(cls, user, action_type, content_object=None, **kwargs):
        """Méthode utilitaire pour logger une action"""
        from django.contrib.contenttypes.models import ContentType
        
        log_entry = cls(
            user=user,
            action_type=action_type,
            ip_address=kwargs.get('ip_address'),
            user_agent=kwargs.get('user_agent', ''),
            request_id=kwargs.get('request_id', ''),
            object_repr=str(content_object) if content_object else '',
            action_details=kwargs.get('action_details', {}),
            changes=kwargs.get('changes', {}),
            severity=kwargs.get('severity', 'low'),
            session_key=kwargs.get('session_key', ''),
        )
        
        if content_object:
            log_entry.content_type = ContentType.objects.get_for_model(content_object)
            log_entry.object_id = content_object.pk
        
        log_entry.save()
        return log_entry


class SecurityEvent(models.Model):
    """
    Modèle pour les événements de sécurité
    """
    
    EVENT_TYPES = [
        ('failed_login', 'Échec de connexion'),
        ('brute_force', 'Attaque par force brute'),
        ('suspicious_ip', 'IP suspecte'),
        ('privilege_escalation', 'Escalade de privilèges'),
        ('data_breach', 'Violation de données'),
        ('unauthorized_access', 'Accès non autorisé'),
        ('sql_injection', 'Tentative d\'injection SQL'),
        ('xss_attempt', 'Tentative XSS'),
        ('csrf_attempt', 'Tentative CSRF'),
        ('rate_limit_exceeded', 'Limite de taux dépassée'),
        ('suspicious_activity', 'Activité suspecte'),
        ('security_violation', 'Violation de sécurité'),
    ]
    
    SEVERITY_LEVELS = [
        ('info', 'Information'),
        ('warning', 'Avertissement'),
        ('error', 'Erreur'),
        ('critical', 'Critique'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'Nouveau'),
        ('investigating', 'En investigation'),
        ('resolved', 'Résolu'),
        ('false_positive', 'Faux positif'),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='security_events',
        verbose_name='Utilisateur concerné'
    )
    event_type = models.CharField(
        max_length=30, 
        choices=EVENT_TYPES,
        verbose_name='Type d\'événement'
    )
    severity = models.CharField(
        max_length=10, 
        choices=SEVERITY_LEVELS,
        verbose_name='Niveau de sévérité'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        verbose_name='Statut'
    )
    
    # Informations sur l'événement
    ip_address = models.GenericIPAddressField(
        verbose_name='Adresse IP source'
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent'
    )
    request_details = models.JSONField(
        default=dict,
        verbose_name='Détails de la requête'
    )
    
    # Description et résolution
    description = models.TextField(
        verbose_name='Description de l\'événement'
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Détails techniques'
    )
    resolution_notes = models.TextField(
        blank=True,
        verbose_name='Notes de résolution'
    )
    
    # Métadonnées
    timestamp = models.DateTimeField(
        default=timezone.now,
        verbose_name='Horodatage'
    )
    resolved_at = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name='Date de résolution'
    )
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_security_events',
        verbose_name='Résolu par'
    )
    
    class Meta:
        verbose_name = 'Événement de sécurité'
        verbose_name_plural = 'Événements de sécurité'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['event_type']),
            models.Index(fields=['severity']),
            models.Index(fields=['status']),
            models.Index(fields=['ip_address']),
        ]
    
    def __str__(self):
        return f"{self.get_event_type_display()} - {self.ip_address} - {self.timestamp}"
    
    @classmethod
    def create_event(cls, event_type, ip_address, **kwargs):
        """Crée un événement de sécurité"""
        event = cls(
            event_type=event_type,
            ip_address=ip_address,
            user=kwargs.get('user'),
            user_agent=kwargs.get('user_agent', ''),
            request_details=kwargs.get('request_details', {}),
            description=kwargs.get('description', ''),
            details=kwargs.get('details', {}),
            severity=kwargs.get('severity', 'warning'),
        )
        event.save()
        return event


class SystemLog(models.Model):
    """
    Modèle pour les logs système
    """
    
    LOG_LEVELS = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    CATEGORIES = [
        ('system', 'Système'),
        ('database', 'Base de données'),
        ('api', 'API'),
        ('auth', 'Authentification'),
        ('payment', 'Paiement'),
        ('email', 'Email'),
        ('backup', 'Sauvegarde'),
        ('performance', 'Performance'),
        ('security', 'Sécurité'),
    ]
    
    level = models.CharField(
        max_length=10,
        choices=LOG_LEVELS,
        verbose_name='Niveau de log'
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORIES,
        verbose_name='Catégorie'
    )
    message = models.TextField(
        verbose_name='Message'
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Détails techniques'
    )
    
    # Contexte
    module = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Module'
    )
    function = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Fonction'
    )
    line_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Numéro de ligne'
    )
    
    # Métadonnées
    timestamp = models.DateTimeField(
        default=timezone.now,
        verbose_name='Horodatage'
    )
    request_id = models.CharField(
        max_length=36,
        blank=True,
        verbose_name='ID de requête'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_logs',
        verbose_name='Utilisateur'
    )
    
    class Meta:
        verbose_name = 'Log système'
        verbose_name_plural = 'Logs système'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['level']),
            models.Index(fields=['category']),
            models.Index(fields=['module']),
        ]
    
    def __str__(self):
        return f"[{self.level}] {self.category}: {self.message[:50]}"
    
    @classmethod
    def log(cls, level, category, message, **kwargs):
        """Méthode utilitaire pour logger"""
        log_entry = cls(
            level=level,
            category=category,
            message=message,
            details=kwargs.get('details', {}),
            module=kwargs.get('module', ''),
            function=kwargs.get('function', ''),
            line_number=kwargs.get('line_number'),
            request_id=kwargs.get('request_id', ''),
            user=kwargs.get('user'),
        )
        log_entry.save()
        return log_entry


class DataAccessLog(models.Model):
    """
    Modèle pour tracer l'accès aux données sensibles
    """
    
    ACCESS_TYPES = [
        ('read', 'Lecture'),
        ('export', 'Export'),
        ('print', 'Impression'),
        ('download', 'Téléchargement'),
    ]
    
    DATA_TYPES = [
        ('personal_data', 'Données personnelles'),
        ('financial_data', 'Données financières'),
        ('contract_data', 'Données contractuelles'),
        ('payment_data', 'Données de paiement'),
        ('analytics_data', 'Données analytiques'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='data_access_logs',
        verbose_name='Utilisateur'
    )
    access_type = models.CharField(
        max_length=10,
        choices=ACCESS_TYPES,
        verbose_name='Type d\'accès'
    )
    data_type = models.CharField(
        max_length=20,
        choices=DATA_TYPES,
        verbose_name='Type de données'
    )
    
    # Informations sur l'accès
    ip_address = models.GenericIPAddressField(
        verbose_name='Adresse IP'
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent'
    )
    
    # Détails de l'accès
    records_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Nombre d\'enregistrements'
    )
    query_details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Détails de la requête'
    )
    export_format = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Format d\'export'
    )
    
    # Métadonnées
    timestamp = models.DateTimeField(
        default=timezone.now,
        verbose_name='Horodatage'
    )
    session_key = models.CharField(
        max_length=40,
        blank=True,
        verbose_name='Clé de session'
    )
    
    class Meta:
        verbose_name = 'Log d\'accès aux données'
        verbose_name_plural = 'Logs d\'accès aux données'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['access_type']),
            models.Index(fields=['data_type']),
            models.Index(fields=['ip_address']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.get_access_type_display()} {self.get_data_type_display()}"
