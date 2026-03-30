from django.urls import path
from . import views

urlpatterns = [
    path('', views.PaiementListCreateView.as_view(), name='paiement-list-create'),
    path('<int:pk>/', views.PaiementDetailView.as_view(), name='paiement-detail'),
    path('<int:pk>/marquer-paye/', views.PaiementMarquerPayeView.as_view(), name='paiement-marquer-paye'),
    path('<int:pk>/generer-reference/', views.PaiementGenererReferenceView.as_view(), name='paiement-generer-reference'),
    path('en-retard/', views.PaiementsEnRetardView.as_view(), name='paiements-en-retard'),
    path('statistiques/', views.paiement_statistics, name='paiement-statistics'),
    path('generer-echeances/<int:contrat_id>/', views.generer_echeances, name='generer-echeances'),
]
