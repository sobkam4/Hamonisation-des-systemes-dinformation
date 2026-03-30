from django.contrib import admin
from .models import RapportMensuel, IndicateurPerformance

@admin.register(RapportMensuel)
class RapportMensuelAdmin(admin.ModelAdmin):
    list_display = ['periode', 'revenus_total', 'depenses_total', 'cashflow', 
                   'taux_occupation', 'date_creation']
    list_filter = ['annee', 'mois', 'date_creation']
    ordering = ['-annee', '-mois']
    readonly_fields = ['date_creation']
    
    def periode(self, obj):
        return f"{obj.mois}/{obj.annee}"
    periode.short_description = 'Période'
    
    fieldsets = (
        ('Période', {
            'fields': ('annee', 'mois')
        }),
        ('Financier', {
            'fields': ('revenus_total', 'depenses_total', 'cashflow')
        }),
        ('Occupation', {
            'fields': ('taux_occupation', 'nombre_biens_loues', 'nombre_biens_total')
        }),
        ('Timestamps', {
            'fields': ('date_creation',)
        }),
    )

@admin.register(IndicateurPerformance)
class IndicateurPerformanceAdmin(admin.ModelAdmin):
    list_display = ['type_indicateur', 'valeur', 'periode', 'date_calcul']
    list_filter = ['type_indicateur', 'date_calcul']
    ordering = ['-date_calcul']
    readonly_fields = ['date_calcul']
    
    def periode(self, obj):
        return f"Du {obj.periode_debut} au {obj.periode_fin}"
    periode.short_description = 'Période'
    
    fieldsets = (
        ('Indicateur', {
            'fields': ('type_indicateur', 'valeur')
        }),
        ('Période', {
            'fields': ('periode_debut', 'periode_fin')
        }),
        ('Timestamps', {
            'fields': ('date_calcul',)
        }),
    )
