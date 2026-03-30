from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import ICEContact, User
from apps.accounts.permissions import IsVerifiedRescuer
from apps.audit.models import AuditLog
from apps.qr_access.models import QrScanLog, QrToken
from apps.qr_access.tokens import build_qr_token, parse_and_verify
from apps.vital_passport.models import VitalPassport


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_qr(request):
    days = int(request.data.get("valid_days", 365))
    days = min(max(days, 1), 730)
    exp = timezone.now() + timedelta(days=days)
    exp_unix = int(exp.timestamp())
    jti = QrToken.new_jti()
    QrToken.objects.create(user=request.user, jti=jti, expires_at=exp)
    token = build_qr_token(jti, request.user.id, exp_unix)
    return Response({"qr_token": token, "expires_at": exp.isoformat()})


@api_view(["POST"])
@permission_classes([IsVerifiedRescuer])
def scan_qr(request):
    raw = request.data.get("token") or request.data.get("qr_token")
    parsed = parse_and_verify(raw.strip() if raw else "")
    if not parsed:
        return Response({"error": "Token invalide ou expiré"}, status=status.HTTP_400_BAD_REQUEST)
    jti, user_id = parsed
    try:
        qt = QrToken.objects.select_related("user").get(jti=jti, user_id=user_id, revoked=False)
    except QrToken.DoesNotExist:
        return Response({"error": "Token révoqué ou inconnu"}, status=status.HTTP_400_BAD_REQUEST)
    if qt.expires_at < timezone.now():
        return Response({"error": "Expiré"}, status=status.HTTP_400_BAD_REQUEST)
    subject = User.objects.filter(pk=user_id).first()
    if not subject:
        return Response({"error": "Utilisateur introuvable"}, status=status.HTTP_404_NOT_FOUND)
    passport = VitalPassport.objects.filter(user_id=user_id).first()
    snapshot = passport.snapshot_for_rescuer() if passport else {}
    ice = list(
        ICEContact.objects.filter(user_id=user_id).values("name", "phone")[:5]
    )
    ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() or request.META.get(
        "REMOTE_ADDR"
    )
    QrScanLog.objects.create(
        rescuer=request.user,
        subject_user_id=user_id,
        success=True,
        ip_address=ip or None,
    )
    AuditLog.objects.create(
        actor=request.user,
        action=AuditLog.Action.QR_SCAN,
        target_type="User",
        target_id=str(user_id),
        metadata={"jti": jti},
        ip_address=ip or None,
    )
    return Response(
        {
            "subject_user_id": user_id,
            "passport_snapshot": snapshot,
            "ice_contacts": ice,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def revoke_qr(request):
    QrToken.objects.filter(user=request.user, revoked=False).update(revoked=True)
    return Response({"detail": "Révoqués"})
