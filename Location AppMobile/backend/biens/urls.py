from django.urls import path
from . import views

urlpatterns = [
    path('', views.BienListCreateView.as_view(), name='bien-list-create'),
    path('<int:pk>/', views.BienDetailView.as_view(), name='bien-detail'),
    path('<int:pk>/changer-statut/', views.BienChangeStatusView.as_view(), name='bien-change-status'),
    path('statistiques/', views.bien_statistics, name='bien-statistics'),
]
