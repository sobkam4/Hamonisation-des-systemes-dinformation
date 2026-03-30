import base64
import hashlib
import hmac
import time

from django.conf import settings


def sign_qr(jti: str, user_id: int, exp_unix: int) -> str:
    msg = f"{jti}:{user_id}:{exp_unix}"
    return hmac.new(
        settings.QR_SECRET_KEY.encode(),
        msg.encode(),
        hashlib.sha256,
    ).hexdigest()


def build_qr_token(jti: str, user_id: int, exp_unix: int) -> str:
    sig = sign_qr(jti, user_id, exp_unix)
    raw = f"{jti}|{user_id}|{exp_unix}|{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def parse_and_verify(token_b64: str) -> tuple[str, int] | None:
    if not token_b64:
        return None
    pad = 4 - len(token_b64) % 4
    if pad != 4:
        token_b64 += "=" * pad
    try:
        raw = base64.urlsafe_b64decode(token_b64.encode()).decode()
        parts = raw.split("|")
        if len(parts) != 4:
            return None
        jti, uid_s, exp_s, sig = parts
        user_id = int(uid_s)
        exp_unix = int(exp_s)
        if exp_unix < int(time.time()):
            return None
        if hmac.compare_digest(sign_qr(jti, user_id, exp_unix), sig):
            return jti, user_id
    except (ValueError, UnicodeDecodeError):
        pass
    return None
