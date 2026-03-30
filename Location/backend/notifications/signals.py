from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Notification
from paiements.models import Paiement
from contrats.models import Contrat
from biens.models import Bien

@receiver(post_save, sender=Paiement)
def creer_notification_paiement(sender, instance, created, **kwargs):
    """Crée une notification lors de la création ou modification d'un paiement"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Récupérer l'utilisateur propriétaire (admin ou créateur du contrat)
    user = instance.contrat.created_by if hasattr(instance.contrat, 'created_by') else None
    if not user:
        # Si pas de créateur, envoyer à tous les admins
        admins = User.objects.filter(role='admin')
        for admin_user in admins:
            if created:
                Notification.objects.create(
                    user=admin_user,
                    type_notification='nouveau_paiement',
                    titre=f'Nouveau paiement reçu',
                    message=f'Un paiement de {instance.montant} GNF a été enregistré pour le contrat #{instance.contrat.id}',
                    priorite='normale',
                    contrat_id=instance.contrat.id,
                    paiement_id=instance.id,
                    client_id=instance.contrat.client.id,
                )
            elif instance.statut == 'en_retard':
                Notification.objects.create(
                    user=admin_user,
                    type_notification='paiement_retard',
                    titre=f'Paiement en retard',
                    message=f'Le paiement du contrat #{instance.contrat.id} est en retard de {instance.jours_retard} jour(s)',
                    priorite='haute',
                    contrat_id=instance.contrat.id,
                    paiement_id=instance.id,
                    client_id=instance.contrat.client.id,
                )
        return
    
    # Notification pour le créateur
    if created:
        Notification.objects.create(
            user=user,
            type_notification='nouveau_paiement',
            titre=f'Nouveau paiement reçu',
            message=f'Un paiement de {instance.montant} GNF a été enregistré pour le contrat #{instance.contrat.id}',
            priorite='normale',
            contrat_id=instance.contrat.id,
            paiement_id=instance.id,
            client_id=instance.contrat.client.id,
        )
    elif instance.statut == 'en_retard':
        Notification.objects.create(
            user=user,
            type_notification='paiement_retard',
            titre=f'Paiement en retard',
            message=f'Le paiement du contrat {instance.contrat.reference} est en retard de {instance.jours_retard} jour(s)',
            priorite='haute',
            contrat_id=instance.contrat.id,
            paiement_id=instance.id,
            client_id=instance.contrat.client.id,
        )

@receiver(post_save, sender=Contrat)
def creer_notification_contrat(sender, instance, created, **kwargs):
    """Crée une notification pour les contrats expirant bientôt"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    user = instance.created_by if hasattr(instance, 'created_by') else None
    if not user:
        admins = User.objects.filter(role='admin')
        for admin_user in admins:
            # Vérifier si le contrat expire dans les 30 prochains jours
            if instance.date_fin:
                jours_restants = (instance.date_fin - timezone.now().date()).days
                if 0 < jours_restants <= 30:
                    Notification.objects.create(
                        user=admin_user,
                        type_notification='contrat_expiration',
                        titre=f'Contrat expirant bientôt',
                        message=f'Le contrat #{instance.id} expire dans {jours_restants} jour(s)',
                        priorite='normale' if jours_restants > 7 else 'haute',
                        contrat_id=instance.id,
                        client_id=instance.client.id,
                        bien_id=instance.bien.id,
                    )
        return
    
    # Vérifier si le contrat expire dans les 30 prochains jours
    if instance.date_fin:
        jours_restants = (instance.date_fin - timezone.now().date()).days
        if 0 < jours_restants <= 30:
            Notification.objects.create(
                user=user,
                type_notification='contrat_expiration',
                titre=f'Contrat expirant bientôt',
                message=f'Le contrat {instance.reference} expire dans {jours_restants} jour(s)',
                priorite='normale' if jours_restants > 7 else 'haute',
                contrat_id=instance.id,
                client_id=instance.client.id,
                bien_id=instance.bien.id,
            )
