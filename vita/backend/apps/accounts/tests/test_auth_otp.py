import pytest
import random
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.mark.django_db
def test_request_and_verify_otp_creates_user(monkeypatch):
    from apps.accounts import tasks

    monkeypatch.setattr(tasks.send_otp_sms, "delay", lambda *a, **k: None)
    monkeypatch.setattr(random, "choices", lambda seq, k=6: ["1", "2", "3", "4", "5", "6"])

    c = APIClient()
    r = c.post("/api/v1/auth/request-otp/", {"phone": "+33612345678"}, format="json")
    assert r.status_code == 200

    r2 = c.post(
        "/api/v1/auth/verify-otp/",
        {"phone": "+33612345678", "code": "123456"},
        format="json",
    )
    assert r2.status_code == 200
    assert "access" in r2.json()
    assert User.objects.filter(phone="+33612345678").exists()
