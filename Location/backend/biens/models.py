from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()

class Bien(models.Model):
    TYPE_BIEN_CHOICES = [
        ('appartement', 'Appartement'),
        ('maison', 'Maison'),
        ('local_commercial', 'Local commercial'),
        ('studio', 'Studio'),
        ('duplex', 'Duplex'),
        ('villa', 'Villa'),
    ]
    
    STATUT_CHOICES = [
        ('disponible', 'Disponible'),
        ('loue', 'Loué'),
        ('maintenance', 'En maintenance'),
    ]
    
    nom = models.CharField(max_length=200)
    type_bien = models.CharField(max_length=20, choices=TYPE_BIEN_CHOICES)
    adresse = models.TextField()
    prix_location = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    superficie = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )
    nombre_pieces = models.PositiveIntegerField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='disponible')
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='biens_crees')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Bien"
        verbose_name_plural = "Biens"
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.nom} - {self.get_type_bien_display()}"
    
    @property
    def est_disponible(self):
        return self.statut == 'disponible'
    
    @property
    def est_loue(self):
        return self.statut == 'loue'
    
    @property
    def est_en_maintenance(self):
        return self.statut == 'maintenance'
    
    def peut_etre_loue(self):
        return self.est_disponible and not self.est_en_maintenance
    
    def _mettre_a_jour_statut(self):
        """Met à jour le statut du bien en fonction des contrats actifs"""
        # Ne pas modifier si le bien est en maintenance
        if self.statut == 'maintenance':
            return
        
        # Vérifier s'il y a des contrats actifs pour ce bien
        from contrats.models import Contrat
        contrats_actifs = Contrat.objects.filter(
            bien=self,
            statut='actif'
        )
        
        # Si il y a des contrats actifs, le bien est loué
        if contrats_actifs.exists():
            if self.statut != 'loue':
                self.statut = 'loue'
        # Sinon, le bien est disponible
        else:
            if self.statut != 'disponible':
                self.statut = 'disponible'
    
    def save(self, *args, **kwargs):
        # Éviter la boucle infinie : si on est déjà en train de mettre à jour le statut, ne pas recalculer
        skip_status_calc = kwargs.pop('skip_status_calc', False)
        
        # Ne pas mettre à jour le statut lors de la création (quand l'objet n'a pas encore d'ID)
        # ou si explicitement demandé
        if not skip_status_calc and self.pk:
            self._mettre_a_jour_statut()
        
        super().save(*args, **kwargs)
