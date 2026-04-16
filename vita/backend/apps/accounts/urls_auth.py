from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts import views_auth

app_name = "accounts_auth"

urlpatterns = [
    path("request-otp/", views_auth.request_otp, name="request-otp"),
    path("verify-otp/", views_auth.verify_otp, name="verify-otp"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", views_auth.logout_view, name="logout"),
]
