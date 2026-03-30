from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit'
    verbose_name = 'Audit et Traçabilité'

    def ready(self):
        """Configuration du module audit"""
        # Importer les signaux pour l'audit automatique
        import audit.signals
