from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.accounts.models import User
from apps.audit.models import AuditLog
from apps.rescuer_verification.models import RescuerApplication


@api_view(["POST"])
@permission_classes([IsAdminUser])
def approve_rescuer(request, application_id: int):
    try:
        app = RescuerApplication.objects.select_related("user").get(pk=application_id)
    except RescuerApplication.DoesNotExist:
        return Response({"error": "Introuvable"}, status=status.HTTP_404_NOT_FOUND)
    app.status = RescuerApplication.Status.APPROVED
    app.reviewer_note = request.data.get("note", "")
    app.save(update_fields=["status", "reviewer_note", "updated_at"])
    u = app.user
    u.is_verified_rescuer = True
    u.role = User.Role.RESCUER
    u.save(update_fields=["is_verified_rescuer", "role"])
    AuditLog.objects.create(
        actor=request.user,
        action=AuditLog.Action.RESCUER_APPROVE,
        target_type="RescuerApplication",
        target_id=str(app.id),
        metadata={"user_id": u.id},
    )
    return Response({"detail": "Approuvé"})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def reject_rescuer(request, application_id: int):
    try:
        app = RescuerApplication.objects.select_related("user").get(pk=application_id)
    except RescuerApplication.DoesNotExist:
        return Response({"error": "Introuvable"}, status=status.HTTP_404_NOT_FOUND)
    app.status = RescuerApplication.Status.REJECTED
    app.reviewer_note = request.data.get("note", "")
    app.save(update_fields=["status", "reviewer_note", "updated_at"])
    return Response({"detail": "Refusé"})
