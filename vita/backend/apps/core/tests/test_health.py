import pytest


@pytest.mark.django_db
def test_health_ok(client):
    r = client.get("/api/v1/health/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"
