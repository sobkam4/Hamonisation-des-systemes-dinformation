import hashlib
import random
import string
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import PhoneOTPChallenge, User
from apps.accounts.tasks import send_otp_sms
from apps.accounts.throttles import OTPRequestThrottle, OTPVerifyThrottle


def _normalize_phone(phone: str) -> str:
    p = (phone or "").strip().replace(" ", "")
    return p


def _hash_code(code: str) -> str:
    return hashlib.sha256(f"{settings.SECRET_KEY}:{code}".encode()).hexdigest()


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([OTPRequestThrottle])
def request_otp(request):
    phone = _normalize_phone(request.data.get("phone", ""))
    if len(phone) < 8:
        return Response({"error": "Numéro invalide"}, status=status.HTTP_400_BAD_REQUEST)
    code = "".join(random.choices(string.digits, k=6))
    expires = timezone.now() + timedelta(minutes=10)
    PhoneOTPChallenge.objects.create(
        phone=phone,
        code_hash=_hash_code(code),
        expires_at=expires,
    )
    send_otp_sms.delay(phone, code)
    return Response({"detail": "Code envoyé"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([OTPVerifyThrottle])
def verify_otp(request):
    phone = _normalize_phone(request.data.get("phone", ""))
    code = (request.data.get("code") or "").strip()
    if not phone or len(code) < 4:
        return Response({"error": "Données invalides"}, status=status.HTTP_400_BAD_REQUEST)
    challenge = (
        PhoneOTPChallenge.objects.filter(phone=phone, consumed=False)
        .order_by("-created_at")
        .first()
    )
    if not challenge or challenge.expires_at < timezone.now():
        return Response({"error": "Code expiré"}, status=status.HTTP_400_BAD_REQUEST)
    if challenge.attempts >= 5:
        return Response({"error": "Trop de tentatives"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    challenge.attempts += 1
    challenge.save(update_fields=["attempts"])
    if challenge.code_hash != _hash_code(code):
        return Response({"error": "Code incorrect"}, status=status.HTTP_400_BAD_REQUEST)
    challenge.consumed = True
    challenge.save(update_fields=["consumed"])
    user, _ = User.objects.get_or_create(phone=phone, defaults={"is_active": True})
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user_id": user.id,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh = request.data.get("refresh")
        if refresh:
            token = RefreshToken(refresh)
            token.blacklist()
    except Exception:
        pass
    return Response(status=status.HTTP_204_NO_CONTENT)
