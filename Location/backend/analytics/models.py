from django.db import models
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from biens.models import Bien
from contrats.models import Contrat
from paiements.models import Paiement
from depenses.models import Depense

class RapportMensuel(models.Model):
    annee = models.IntegerField()
    mois = models.IntegerField()
    revenus_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    depenses_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cashflow = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    taux_occupation = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    nombre_biens_loues = models.IntegerField(default=0)
    nombre_biens_total = models.IntegerField(default=0)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Rapport mensuel"
        verbose_name_plural = "Rapports mensuels"
        unique_together = ['annee', 'mois']
        ordering = ['-annee', '-mois']
    
    def __str__(self):
        return f"Rapport {self.mois}/{self.annee}"
    
    @classmethod
    def generer_rapport(cls, annee, mois):
        from django.db.models import Q
        
        # Calcul des revenus
        revenus = Paiement.objects.filter(
            date_paiement__year=annee,
            date_paiement__month=mois,
            statut='paye'
        ).aggregate(total=Sum('montant'))['total'] or 0
        
        # Calcul des dépenses
        depenses = Depense.objects.filter(
            date__year=annee,
            date__month=mois
        ).aggregate(total=Sum('montant'))['total'] or 0
        
        # Taux d'occupation
        total_biens = Bien.objects.count()
        biens_loues = Bien.objects.filter(statut='loue').count()
        taux_occupation = (biens_loues / total_biens * 100) if total_biens > 0 else 0
        
        rapport, created = cls.objects.update_or_create(
            annee=annee,
            mois=mois,
            defaults={
                'revenus_total': revenus,
                'depenses_total': depenses,
                'cashflow': revenus - depenses,
                'taux_occupation': taux_occupation,
                'nombre_biens_loues': biens_loues,
                'nombre_biens_total': total_biens,
            }
        )
        
        return rapport

class IndicateurPerformance(models.Model):
    TYPE_INDICATEUR_CHOICES = [
        ('roi', 'ROI'),
        ('cashflow', 'Cashflow'),
        ('occupation', 'Taux occupation'),
        ('revenu_moyen', 'Revenu moyen'),
        ('depense_moyenne', 'Dépense moyenne'),
    ]
    
    type_indicateur = models.CharField(max_length=20, choices=TYPE_INDICATEUR_CHOICES)
    valeur = models.DecimalField(max_digits=12, decimal_places=2)
    periode_debut = models.DateField()
    periode_fin = models.DateField()
    date_calcul = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Indicateur de performance"
        verbose_name_plural = "Indicateurs de performance"
        ordering = ['-date_calcul']
    
    def __str__(self):
        return f"{self.get_type_indicateur_display()}: {self.valeur}"
    
    @classmethod
    def calculer_roi(cls, periode_debut, periode_fin):
        revenus = Paiement.objects.filter(
            date_paiement__range=[periode_debut, periode_fin],
            statut='paye'
        ).aggregate(total=Sum('montant'))['total'] or 0
        
        depenses = Depense.objects.filter(
            date__range=[periode_debut, periode_fin]
        ).aggregate(total=Sum('montant'))['total'] or 0
        
        if depenses > 0:
            roi = ((revenus - depenses) / depenses) * 100
        else:
            roi = 0
        
        return cls.objects.create(
            type_indicateur='roi',
            valeur=roi,
            periode_debut=periode_debut,
            periode_fin=periode_fin
        )
