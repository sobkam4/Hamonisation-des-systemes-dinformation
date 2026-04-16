import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.qr_access.models import QrToken
from apps.qr_access.tokens import build_qr_token


@pytest.mark.django_db
def test_scan_requires_verified_rescuer():
    citizen = User.objects.create_user(phone="+33111111111")
    rescuer = User.objects.create_user(phone="+33222222222")
    rescuer.is_verified_rescuer = True
    rescuer.role = User.Role.RESCUER
    rescuer.save()

    exp = int((timezone.now() + timedelta(days=1)).timestamp())
    jti = QrToken.new_jti()
    QrToken.objects.create(user=citizen, jti=jti, expires_at=timezone.now() + timedelta(days=1))
    token = build_qr_token(jti, citizen.id, exp)

    c = APIClient()
    c.force_authenticate(user=rescuer)
    r = c.post("/api/v1/qr/scan/", {"token": token}, format="json")
    assert r.status_code == 200
    assert r.json()["subject_user_id"] == citizen.id
    assert "passport_snapshot" in r.json()
