import uuid

import boto3
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.rescuer_verification.models import RescuerApplication
from apps.rescuer_verification.serializers import RescuerApplicationSerializer


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL or None,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def apply_rescuer(request):
    bucket = getattr(settings, "VITA_EVIDENCE_BUCKET", "vita-evidence")
    org = request.data.get("organization_name", "")
    diploma = request.data.get("diploma_type", "")
    if not diploma:
        return Response({"error": "diploma_type requis"}, status=status.HTTP_400_BAD_REQUEST)
    key = f"proofs/{request.user.id}/{uuid.uuid4().hex}"
    app = RescuerApplication.objects.create(
        user=request.user,
        organization_name=org,
        diploma_type=diploma,
        proof_storage_key=key,
        proof_original_name=request.data.get("filename", "proof.pdf"),
        status=RescuerApplication.Status.PENDING,
    )
    upload_url = _s3_client().generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=3600,
    )
    return Response(
        {
            "application_id": app.id,
            "upload_url": upload_url,
            "storage_key": key,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def rescuer_status(request):
    app = (
        RescuerApplication.objects.filter(user=request.user)
        .order_by("-created_at")
        .first()
    )
    if not app:
        return Response({"status": None})
    return Response(RescuerApplicationSerializer(app).data)
