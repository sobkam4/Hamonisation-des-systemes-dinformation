from django.urls import path
from . import views
from . import export_views

urlpatterns = [
    path('rapports-mensuels/', views.RapportMensuelListView.as_view(), name='rapport-mensuel-list'),
    path('rapports-mensuels/<int:annee>/<int:mois>/', views.RapportMensuelDetailView.as_view(), name='rapport-mensuel-detail'),
    path('rapports-mensuels/<int:annee>/<int:mois>/generer/', views.GenererRapportMensuelView.as_view(), name='generer-rapport-mensuel'),
    path('indicateurs/', views.IndicateurPerformanceListView.as_view(), name='indicateur-performance-list'),
    path('indicateurs/calculer-roi/', views.calculer_roi, name='calculer-roi'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('cashflow/', views.cashflow, name='cashflow'),
    path('projection/', views.projection, name='projection'),
    path('rapport-clients-contrats/', views.rapport_clients_contrats, name='rapport-clients-contrats'),
    # Export endpoints
    path('export/rapport-mensuel/excel/', export_views.export_rapport_mensuel_excel, name='export-rapport-mensuel-excel'),
    path('export/rapport-mensuel/pdf/', export_views.export_rapport_mensuel_pdf, name='export-rapport-mensuel-pdf'),
    path('export/rapport-annuel/excel/', export_views.export_rapport_annuel_excel, name='export-rapport-annuel-excel'),
]
