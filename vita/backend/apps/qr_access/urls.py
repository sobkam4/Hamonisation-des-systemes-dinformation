from django.urls import path

from apps.qr_access import views

app_name = "qr"

urlpatterns = [
    path("generate/", views.generate_qr, name="generate"),
    path("scan/", views.scan_qr, name="scan"),
    path("revoke/", views.revoke_qr, name="revoke"),
]
