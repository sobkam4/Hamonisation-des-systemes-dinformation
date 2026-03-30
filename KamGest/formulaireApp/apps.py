from django.apps import AppConfig


class FormulaireappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'formulaireApp'

    def ready(self):
        from . import signals  # noqa: F401
