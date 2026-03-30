from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from biens.models import Bien

User = get_user_model()

class CategorieDepense(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Catégorie de dépense"
        verbose_name_plural = "Catégories de dépenses"
        ordering = ['nom']
    
    def __str__(self):
        return self.nom

class Depense(models.Model):
    TYPE_DEPENSE_CHOICES = [
        ('reparation', 'Réparation'),
        ('entretien', 'Entretien'),
        ('taxe', 'Taxe'),
        ('assurance', 'Assurance'),
        ('service', 'Service'),
        ('materiel', 'Matériel'),
        ('autre', 'Autre'),
    ]
    
    date = models.DateField()
    categorie = models.ForeignKey(CategorieDepense, on_delete=models.PROTECT)
    description = models.TextField()
    montant = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    type_depense = models.CharField(max_length=20, choices=TYPE_DEPENSE_CHOICES)
    bien = models.ForeignKey(Bien, on_delete=models.SET_NULL, null=True, blank=True)
    facture = models.FileField(upload_to='factures/', blank=True, null=True)
    numero_facture = models.CharField(max_length=100, blank=True, null=True)
    fournisseur = models.CharField(max_length=200, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='depenses_crees')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Dépense"
        verbose_name_plural = "Dépenses"
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.categorie.nom} - {self.montant} GNF - {self.date}"
    
    @property
    def annee(self):
        return self.date.year
    
    @property
    def mois(self):
        return self.date.month
