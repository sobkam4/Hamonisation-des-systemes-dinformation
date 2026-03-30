# Celery configuration (optionnel)
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Celery n'est pas installé, ce n'est pas grave pour le développement
    celery_app = None
    __all__ = ()
