from django.urls import path

from apps.alerts.views import NearbyAlertsView

app_name = "alerts"

urlpatterns = [
    path("nearby/", NearbyAlertsView.as_view(), name="nearby"),
]
