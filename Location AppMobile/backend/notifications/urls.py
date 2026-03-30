from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    path('marquer-toutes-lues/', views.marquer_toutes_comme_lues, name='notification-marquer-toutes-lues'),
    path('nombre-non-lues/', views.nombre_notifications_non_lues, name='notification-nombre-non-lues'),
    path('supprimer-lues/', views.supprimer_notifications_lues, name='notification-supprimer-lues'),
]
