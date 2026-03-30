from django.urls import path
from . import views

urlpatterns = [
    path('', views.DepenseListCreateView.as_view(), name='depense-list-create'),
    path('<int:pk>/', views.DepenseDetailView.as_view(), name='depense-detail'),
    path('categories/', views.CategorieDepenseListView.as_view(), name='categorie-depense-list'),
    path('categories/<int:pk>/', views.CategorieDepenseDetailView.as_view(), name='categorie-depense-detail'),
    path('statistiques/', views.depense_statistics, name='depense-statistics'),
    path('import/', views.ImportDepensesCSVView.as_view(), name='import-depenses'),
]
