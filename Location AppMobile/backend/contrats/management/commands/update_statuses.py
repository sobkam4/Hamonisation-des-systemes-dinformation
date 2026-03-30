"""
Commande Django pour mettre à jour automatiquement tous les statuts
des contrats, biens et clients.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from contrats.models import Contrat
from biens.models import Bien
from clients.models import Client
from paiements.models import Paiement


class Command(BaseCommand):
    help = 'Met à jour automatiquement les statuts des contrats, biens et clients'

    def add_arguments(self, parser):
        parser.add_argument(
            '--contrats',
            action='store_true',
            help='Mettre à jour uniquement les statuts des contrats',
        )
        parser.add_argument(
            '--biens',
            action='store_true',
            help='Mettre à jour uniquement les statuts des biens',
        )
        parser.add_argument(
            '--clients',
            action='store_true',
            help='Mettre à jour uniquement les statuts des clients',
        )

    def handle(self, *args, **options):
        update_contrats = options.get('contrats', False)
        update_biens = options.get('biens', False)
        update_clients = options.get('clients', False)
        
        # Si aucune option spécifique n'est fournie, tout mettre à jour
        update_all = not (update_contrats or update_biens or update_clients)
        
        if update_all or update_contrats:
            self.update_contrats_status()
        
        if update_all or update_biens:
            self.update_biens_status()
        
        if update_all or update_clients:
            self.update_clients_status()
        
        self.stdout.write(
            self.style.SUCCESS('✓ Mise à jour des statuts terminée avec succès')
        )

    def update_contrats_status(self):
        """Met à jour les statuts de tous les contrats basés sur les dates"""
        self.stdout.write('Mise à jour des statuts des contrats...')
        today = timezone.now().date()
        
        contrats = Contrat.objects.all()
        updated = 0
        
        for contrat in contrats:
            old_status = contrat.statut
            
            # Ne pas modifier si le statut est 'resilie' (résilié manuellement)
            if contrat.statut == 'resilie':
                continue
            
            # Calculer le nouveau statut
            if contrat.date_debut > today:
                nouveau_statut = 'en_attente'
            elif contrat.date_debut <= today <= contrat.date_fin:
                nouveau_statut = 'actif'
            else:
                nouveau_statut = 'termine'
            
            # Mettre à jour si le statut a changé
            if nouveau_statut != old_status:
                contrat.statut = nouveau_statut
                contrat.save(skip_status_calc=True)
                updated += 1
                self.stdout.write(
                    f'  - Contrat {contrat.id}: {old_status} → {nouveau_statut}'
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'  ✓ {updated} contrat(s) mis à jour')
        )

    def update_biens_status(self):
        """Met à jour les statuts de tous les biens basés sur les contrats actifs"""
        self.stdout.write('Mise à jour des statuts des biens...')
        
        biens = Bien.objects.all()
        updated = 0
        
        for bien in biens:
            # Ne pas modifier si le bien est en maintenance
            if bien.statut == 'maintenance':
                continue
            
            old_status = bien.statut
            
            # Vérifier s'il y a des contrats actifs pour ce bien
            contrats_actifs = Contrat.objects.filter(
                bien=bien,
                statut='actif'
            )
            
            # Si il y a des contrats actifs, le bien est loué
            if contrats_actifs.exists():
                nouveau_statut = 'loue'
            else:
                nouveau_statut = 'disponible'
            
            # Mettre à jour si le statut a changé
            if nouveau_statut != old_status:
                bien.statut = nouveau_statut
                bien.save(skip_status_calc=True)
                updated += 1
                self.stdout.write(
                    f'  - Bien {bien.id} ({bien.nom}): {old_status} → {nouveau_statut}'
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'  ✓ {updated} bien(s) mis à jour')
        )

    def update_clients_status(self):
        """Met à jour les statuts defaut_paiement de tous les clients"""
        self.stdout.write('Mise à jour des statuts des clients...')
        
        clients = Client.objects.all()
        updated = 0
        
        for client in clients:
            old_status = client.defaut_paiement
            
            # Récupérer tous les contrats actifs du client
            contrats_actifs = client.get_contrats_actifs()
            
            # Vérifier s'il y a des paiements en retard pour ces contrats
            paiements_en_retard = Paiement.objects.filter(
                contrat__in=contrats_actifs,
                statut='en_retard'
            ).exists()
            
            # Mettre à jour defaut_paiement
            if paiements_en_retard and not client.defaut_paiement:
                client.defaut_paiement = True
                client.save(skip_status_calc=True)
                updated += 1
                self.stdout.write(
                    f'  - Client {client.id} ({client.nom_complet}): defaut_paiement = True'
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'  ✓ {updated} client(s) mis à jour')
        )
