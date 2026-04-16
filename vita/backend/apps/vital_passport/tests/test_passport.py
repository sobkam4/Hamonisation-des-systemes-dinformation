import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.fixture
def authed_client(db):
    u = User.objects.create_user(phone="+33999888777")
    c = APIClient()
    c.force_authenticate(user=u)
    return c, u


@pytest.mark.django_db
def test_passport_patch_encrypted(authed_client):
    c, _ = authed_client
    r = c.patch(
        "/api/v1/passport/",
        {
            "blood_group": "A+",
            "allergies": ["penicilline"],
            "organ_donor": True,
        },
        format="json",
    )
    assert r.status_code == 200
    assert r.json()["blood_group"] == "A+"
    from apps.vital_passport.models import VitalPassport

    vp = VitalPassport.objects.get()
    assert "A+" not in (vp.payload_encrypted or "")
    assert vp.get_health_payload().get("blood_group") == "A+"
