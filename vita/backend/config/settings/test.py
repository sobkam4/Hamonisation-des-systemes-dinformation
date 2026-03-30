from .base import *  # noqa

DEBUG = True
SECRET_KEY = "test-secret-key-at-least-32-characters-long-for-jwt"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
VITA_FIELD_ENCRYPTION_KEY = "test-key-32-bytes-long!!!!!!"
USE_S3 = False
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
