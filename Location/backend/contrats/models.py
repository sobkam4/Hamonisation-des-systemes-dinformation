from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.contrib.auth import get_user_model
from biens.models import Bien
from clients.models import Client

User = get_user_model()

class Contrat(models.Model):
    STATUT_CHOICES = [
        ('actif', 'Actif'),
        ('termine', 'Terminé'),
        ('resilie', 'Résilié'),
        ('en_attente', 'En attente'),
    ]
    
    client = models.ForeignKey(Client, on_delete=models.PROTECT)
    bien = models.ForeignKey(Bien, on_delete=models.PROTECT)
    date_debut = models.DateField()
    date_fin = models.DateField()
    montant_mensuel = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    caution = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Montant de la caution/deposit"
    )
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    conditions_particulieres = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='contrats_crees')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    date_signature = models.DateField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Contrat"
        verbose_name_plural = "Contrats"
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Contrat {self.id} - {self.client.nom_complet} - {self.bien.nom}"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        if self.date_fin <= self.date_debut:
            raise ValidationError("La date de fin doit être postérieure à la date de début.")
        
        if self.pk:
            existing_contrats = Contrat.objects.filter(
                bien=self.bien,
                statut='actif'
            ).exclude(pk=self.pk)
            
            if existing_contrats.exists():
                raise ValidationError("Ce bien est déjà loué par un contrat actif.")
    
    def _calculer_statut(self):
        """Calcule et met à jour le statut du contrat en fonction des dates"""
        today = timezone.now().date()
        
        # Ne pas modifier si le statut est 'resilie' (résilié manuellement)
        if self.statut == 'resilie':
            return
        
        # Si le contrat n'est pas encore commencé
        if self.date_debut > today:
            nouveau_statut = 'en_attente'
        # Si le contrat est en cours
        elif self.date_debut <= today <= self.date_fin:
            nouveau_statut = 'actif'
        # Si le contrat est terminé
        else:
            nouveau_statut = 'termine'
        
        # Mettre à jour seulement si le statut a changé
        if nouveau_statut and nouveau_statut != self.statut:
            self.statut = nouveau_statut
    
    def save(self, *args, **kwargs):
        # Éviter la boucle infinie : si on est déjà en train de mettre à jour le statut, ne pas recalculer
        skip_status_calc = kwargs.pop('skip_status_calc', False)
        
        # Calculer le statut automatiquement avant la sauvegarde
        if not skip_status_calc:
            self._calculer_statut()
        
        self.clean()
        super().save(*args, **kwargs)
        
        # Mettre à jour le statut du bien en fonction des contrats actifs
        self._mettre_a_jour_statut_bien()
    
    @property
    def est_actif(self):
        return self.statut == 'actif' and self.date_debut <= timezone.now().date() <= self.date_fin
    
    @property
    def est_expire(self):
        return self.date_fin < timezone.now().date()
    
    @property
    def duree_mois(self):
        return (self.date_fin.year - self.date_debut.year) * 12 + (self.date_fin.month - self.date_debut.month) + 1
    
    def get_paiements_en_retard(self):
        from paiements.models import Paiement
        return self.paiement_set.filter(statut='en_retard')
    
    def _mettre_a_jour_statut_bien(self):
        """Met à jour le statut du bien en fonction des contrats actifs"""
        # Ne pas modifier si le bien est en maintenance
        if self.bien.statut == 'maintenance':
            return
        
        # Vérifier s'il y a des contrats actifs pour ce bien (y compris ce contrat)
        contrats_actifs = Contrat.objects.filter(
            bien=self.bien,
            statut='actif'
        )
        
        # Si il y a des contrats actifs, le bien est loué
        if contrats_actifs.exists():
            if self.bien.statut != 'loue':
                self.bien.statut = 'loue'
                self.bien.save(skip_status_calc=True)
        # Sinon, le bien est disponible
        else:
            if self.bien.statut != 'disponible':
                self.bien.statut = 'disponible'
                self.bien.save(skip_status_calc=True)
    
    def calculer_solde_total(self):
        from paiements.models import Paiement
        paiements = self.paiement_set.all()
        total_du = self.montant_mensuel * self.duree_mois
        total_paye = sum(p.montant for p in paiements if p.statut == 'payé')
        return total_du - total_paye
