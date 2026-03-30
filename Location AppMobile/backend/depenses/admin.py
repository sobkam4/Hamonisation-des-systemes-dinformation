from django.contrib import admin
from .models import Depense, CategorieDepense

@admin.register(CategorieDepense)
class CategorieDepenseAdmin(admin.ModelAdmin):
    list_display = ['nom', 'date_creation']
    search_fields = ['nom']
    ordering = ['nom']

@admin.register(Depense)
class DepenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'categorie', 'montant', 'date', 'type_depense', 'bien']
    list_filter = ['categorie', 'type_depense', 'date', 'date_creation']
    search_fields = ['description', 'fournisseur', 'numero_facture']
    ordering = ['-date']
    readonly_fields = ['date_creation', 'date_modification']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('date', 'categorie', 'description', 'montant')
        }),
        ('Type et affectation', {
            'fields': ('type_depense', 'bien')
        }),
        ('Informations fournisseur', {
            'fields': ('fournisseur', 'numero_facture')
        }),
        ('Documents', {
            'fields': ('facture',)
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
