from django.urls import path
from . import views

urlpatterns = [
    path('', views.ContratListCreateView.as_view(), name='contrat-list-create'),
    path('<int:pk>/', views.ContratDetailView.as_view(), name='contrat-detail'),
    path('<int:pk>/resilier/', views.ContratResilierView.as_view(), name='contrat-resilier'),
    path('<int:pk>/paiements/', views.ContratPaiementsView.as_view(), name='contrat-paiements'),
    path('<int:pk>/solde/', views.ContratSoldeView.as_view(), name='contrat-solde'),
    path('statistiques/', views.contrat_statistics, name='contrat-statistics'),
]
