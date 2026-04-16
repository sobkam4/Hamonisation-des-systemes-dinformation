from django.urls import path

from apps.vital_passport.views import VitalPassportDetailView

app_name = "passport"

urlpatterns = [
    path("", VitalPassportDetailView.as_view(), name="detail"),
]
