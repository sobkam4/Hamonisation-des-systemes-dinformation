from django.urls import path
from . import views

urlpatterns = [
    path('', views.ClientListCreateView.as_view(), name='client-list-create'),
    path('<int:pk>/', views.ClientDetailView.as_view(), name='client-detail'),
    path('<int:pk>/contrats/', views.ClientContratsView.as_view(), name='client-contrats'),
    path('<int:pk>/marquer-defaut/', views.ClientMarquerDefautView.as_view(), name='client-marquer-defaut'),
    path('statistiques/', views.client_statistics, name='client-statistics'),
]
