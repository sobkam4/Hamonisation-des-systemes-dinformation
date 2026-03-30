

# 📘 Cahier des charges

## ERP de Gestion de Location Immobilière

---

# 1️⃣ Contexte du projet

Développement d’un ERP web permettant de :

* Gérer des biens immobiliers
* Gérer les locataires
* Gérer les contrats
* Suivre les paiements
* Analyser la rentabilité (ROI)
* Générer des rapports financiers

Objectif : disposer d’un système centralisé, évolutif et exploitable pour pilotage financier.

---

# 2️⃣ Périmètre fonctionnel

## 2.1 Modules principaux

### Module 1 : Gestion des utilisateurs

* Authentification
* Rôles :

  * Administrateur
  * Gestionnaire
  * Comptable
* Permissions par module

---

### Module 2 : Gestion des biens

**Entité : Bien**

* Nom
* Type (Appartement, Maison, Local commercial…)
* Adresse
* Prix de location
* Statut :

  * Disponible
  * Loué
  * En maintenance

Règles métier :

* Un bien ne peut avoir qu’un seul contrat actif à la fois.
* Un bien en maintenance ne peut être loué.

---

### Module 3 : Gestion des clients

**Entité : Client**

* Nom
* Téléphone
* Email
* Adresse
* Historique des contrats

Règles :

* Un client peut avoir plusieurs contrats.
* Un client en défaut de paiement peut être signalé.

---

### Module 4 : Gestion des contrats

**Entité : Contrat**

* Client (FK)
* Bien (FK)
* Date début
* Date fin
* Montant mensuel
* Caution
* Statut :

  * Actif
  * Terminé
  * Résilié

Règles métier :

* Impossible de créer un contrat si le bien est déjà loué.
* Un contrat actif doit générer automatiquement des échéances mensuelles.
* Résiliation possible avec historique conservé.

---

### Module 5 : Gestion des paiements

**Entité : Paiement**

* Contrat (FK)
* Date paiement
* Montant
* Type (Espèces, Virement, Mobile Money)
* Statut :

  * En attente
  * Partiel
  * Payé
  * En retard

Règles :

* Calcul automatique du solde restant.
* Détection automatique des retards.
* Historique complet conservé.

---

### Module 6 : Gestion des dépenses

**Entité : Dépense**

* Date
* Catégorie
* Description
* Montant
* Projet associé (optionnel)

Possibilité :

* Import CSV
* Synchronisation Google Sheets

---

### Module 7 : Analyse financière

Indicateurs calculés :

* Dépenses totales
* Revenus cumulés
* Cashflow mensuel
* Taux d’occupation
* ROI

### Formule ROI :

ROI = (Revenus – Dépenses) / Dépenses × 100

Visualisation :

* Graphiques revenus/dépenses
* Projection sur 12 mois
* Évolution du ROI

---

# 3️⃣ Architecture technique

## Backend

* Django
* Django REST Framework

## Base de données

* PostgreSQL (production)
* SQLite (développement)

## Conteneurisation

* Docker
* Docker Compose

## API REST

Endpoints principaux :

* /api/biens/
* /api/clients/
* /api/contrats/
* /api/paiements/
* /api/depenses/
* /api/roi/

---

# 4️⃣ Intégrations externes

## WhatsApp

* Envoi automatique facture PDF
* Rappel de paiement
* Via Twilio API ou WhatsApp Business API

## Power BI

* Consommation API REST
* Dashboard externe
* Option embed dans interface

---

# 5️⃣ Sécurité

* Authentification JWT
* Permissions par rôle
* Protection CSRF
* Logs des actions critiques
* Sauvegarde automatique base de données

---

# 6️⃣ Contraintes techniques

* Application web responsive
* Code versionné via Git
* Documentation technique (README)
* Tests unitaires obligatoires

---

# 7️⃣ Plan de développement

Phase 1 :

* Authentification
* Biens
* Clients

Phase 2 :

* Contrats
* Paiements

Phase 3 :

* Dépenses
* ROI
* Dashboard

Phase 4 :

* API REST complète
* Docker
* Intégration Power BI

Phase 5 :

* Automatisations
* Notifications
* Optimisation

---

# 8️⃣ Évolutions futures possibles

* Multi-propriétaire
* Multi-devises
* Application mobile
* Intégration Mobile Money locale
* Module comptable avancé
* Intelligence prédictive (prévision loyers impayés)

---

# 🎯 Positionnement stratégique

Ce projet peut évoluer vers :

* SaaS local pour propriétaires immobiliers
* ERP simplifié pour PME
* Outil de gestion immobilière pour marché africain

---

# Conclusion

Ce document définit :

✔ Périmètre clair
✔ Structure métier
✔ Architecture technique
✔ Évolutivité
✔ Vision business

Tu ne construis plus un simple projet Django.
Tu construis un produit structuré.


