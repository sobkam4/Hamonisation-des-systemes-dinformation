from django.urls import path

from apps.rescuer_verification import views

app_name = "rescuer"

urlpatterns = [
    path("apply/", views.apply_rescuer, name="apply"),
    path("status/", views.rescuer_status, name="status"),
]
