from django.urls import include, path

urlpatterns = [
    path("health/", include(("apps.core.urls", "core"), namespace="core")),
    path("auth/", include(("apps.accounts.urls_auth", "accounts_auth"), namespace="auth")),
    path("users/", include(("apps.accounts.urls", "accounts"), namespace="accounts")),
    path("rescuer/", include(("apps.rescuer_verification.urls", "rescuer"), namespace="rescuer")),
    path("passport/", include(("apps.vital_passport.urls", "passport"), namespace="passport")),
    path("qr/", include(("apps.qr_access.urls", "qr"), namespace="qr")),
    path("content/", include(("apps.content.urls", "content"), namespace="content")),
    path("training/", include(("apps.training.urls", "training"), namespace="training")),
    path("enterprise/", include(("apps.enterprise.urls", "enterprise"), namespace="enterprise")),
    path("emergency/", include(("apps.emergency.urls", "emergency"), namespace="emergency")),
    path("alerts/", include(("apps.alerts.urls", "alerts"), namespace="alerts")),
    path("admin-api/", include(("apps.accounts.urls_admin", "accounts_admin"), namespace="accounts_admin")),
]
