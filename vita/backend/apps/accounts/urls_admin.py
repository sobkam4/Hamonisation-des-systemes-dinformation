from django.urls import path

from apps.accounts import views_admin

app_name = "accounts_admin"

urlpatterns = [
    path(
        "rescuer/<int:application_id>/approve/",
        views_admin.approve_rescuer,
        name="rescuer-approve",
    ),
    path(
        "rescuer/<int:application_id>/reject/",
        views_admin.reject_rescuer,
        name="rescuer-reject",
    ),
]
