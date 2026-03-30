import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


def _fernet_key_bytes() -> bytes:
    key = (getattr(settings, "VITA_FIELD_ENCRYPTION_KEY", None) or "").strip()
    if not key:
        if not settings.DEBUG:
            raise RuntimeError("VITA_FIELD_ENCRYPTION_KEY is required in production")
        # Deterministic dev-only key
        return base64.urlsafe_b64encode(hashlib.sha256(b"vita-dev-encryption").digest())
    if len(key) == 44 and key.endswith("="):
        return key.encode()
    digest = hashlib.sha256(key.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def _fernet() -> Fernet:
    return Fernet(_fernet_key_bytes())


def encrypt_field(plain: str) -> str:
    if plain is None or plain == "":
        return ""
    return _fernet().encrypt(plain.encode()).decode()


def decrypt_field(token: str) -> str:
    if not token:
        return ""
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        return ""
