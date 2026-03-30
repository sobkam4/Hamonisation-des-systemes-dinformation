import os

from .base import *  # noqa

DEBUG = os.environ.get("DEBUG", "0") == "1"
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    x.strip()
    for x in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if x.strip()
]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
