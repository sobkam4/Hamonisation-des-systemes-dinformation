from django.urls import path

from apps.core.views import health

app_name = "core"

urlpatterns = [
    path("", health, name="health"),
]
