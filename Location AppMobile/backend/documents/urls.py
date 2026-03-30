from django.urls import path
from . import views
from . import pdf_views

urlpatterns = [
    path('', views.DocumentListCreateView.as_view(), name='document-list-create'),
    path('<int:pk>/', views.DocumentDetailView.as_view(), name='document-detail'),
    # Génération de PDFs
    path('pdf/contrat/<int:contrat_id>/', pdf_views.generer_pdf_contrat, name='pdf-contrat'),
    path('pdf/quittance/<int:paiement_id>/', pdf_views.generer_pdf_quittance, name='pdf-quittance'),
    path('pdf/recu/<int:paiement_id>/', pdf_views.generer_pdf_recu, name='pdf-recu'),
]
