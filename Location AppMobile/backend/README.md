# ERP de Gestion de Location Immobilière

Une solution complète de gestion immobilière développée avec Django REST Framework pour optimiser la gestion des biens, clients, contrats et analyse financière.

## 🏗️ Architecture

### Stack Technique
- **Backend**: Django 5.2.11 + Django REST Framework
- **Base de données**: PostgreSQL (production) / SQLite (développement)
- **Authentification**: JWT avec SimpleJWT
- **File d'attente**: Celery + Redis
- **Conteneurisation**: Docker + Docker Compose

### Modules Principaux

#### 1. Module d'Authentification (`authentication`)
- Gestion des utilisateurs avec rôles (Admin, Gestionnaire, Comptable)
- Authentification JWT
- Permissions par module

#### 2. Module des Biens (`biens`)
- Gestion des biens immobiliers
- Types: Appartement, Maison, Local commercial, etc.
- Statuts: Disponible, Loué, En maintenance
- Validation des règles métier

#### 3. Module des Clients (`clients`)
- Gestion des locataires
- Historique des contrats
- Suivi des défauts de paiement

#### 4. Module des Contrats (`contrats`)
- Gestion des contrats de location
- Calcul automatique des durées
- Gestion des résiliations

#### 5. Module des Paiements (`paiements`)
- Suivi des échéances
- Génération automatique des paiements
- Détection des retards
- Types de paiement: Espèces, Virement, Mobile Money

#### 6. Module des Dépenses (`depenses`)
- Suivi des dépenses par catégorie
- Import CSV
- Gestion des factures

#### 7. Module d'Analyse (`analytics`)
- Calcul du ROI
- Rapports mensuels
- Dashboard financier
- Projections sur 12 mois

## 🚀 Installation

### Prérequis
- Python 3.10+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optionnel)

### Installation Locale

1. **Cloner le projet**
```bash
git clone <repository-url>
cd location-erp/backend
```

2. **Créer l'environnement virtuel**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

4. **Configurer la base de données**
```bash
# Modifier les settings.py pour PostgreSQL
python manage.py makemigrations
python manage.py migrate
```

5. **Créer le superutilisateur**
```bash
python manage.py createsuperuser
```

6. **Démarrer le serveur**
```bash
python manage.py runserver
```

### Installation avec Docker

1. **Développement**
```bash
docker-compose up --build
```

2. **Production**
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## 📡 API Documentation

### Authentification

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

#### Register
```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "user",
  "email": "user@example.com",
  "password": "password",
  "password_confirm": "password",
  "role": "gestionnaire",
  "first_name": "John",
  "last_name": "Doe"
}
```

### Endpoints Principaux

#### Biens
- `GET /api/biens/` - Lister les biens
- `POST /api/biens/` - Créer un bien
- `GET /api/biens/{id}/` - Détails d'un bien
- `PUT /api/biens/{id}/changer-statut/` - Changer le statut
- `GET /api/biens/statistiques/` - Statistiques des biens

#### Clients
- `GET /api/clients/` - Lister les clients
- `POST /api/clients/` - Créer un client
- `GET /api/clients/{id}/contrats/` - Contrats d'un client
- `PUT /api/clients/{id}/marquer-defaut/` - Marquer défaut paiement

#### Contrats
- `GET /api/contrats/` - Lister les contrats
- `POST /api/contrats/` - Créer un contrat
- `PUT /api/contrats/{id}/resilier/` - Résilier un contrat
- `GET /api/contrats/{id}/paiements/` - Paiements d'un contrat

#### Paiements
- `GET /api/paiements/` - Lister les paiements
- `POST /api/paiements/` - Enregistrer un paiement
- `PUT /api/paiements/{id}/marquer-paye/` - Marquer comme payé
- `POST /api/paiements/generer-echeances/{contrat_id}/` - Générer échéances

#### Dépenses
- `GET /api/depenses/` - Lister les dépenses
- `POST /api/depenses/` - Ajouter une dépense
- `POST /api/depenses/import-csv/` - Importer CSV
- `GET /api/depenses/categories/` - Catégories de dépenses

#### Analytics
- `GET /api/analytics/dashboard/` - Dashboard principal
- `GET /api/analytics/cashflow/` - Cashflow mensuel
- `GET /api/analytics/projection/` - Projections financières
- `POST /api/analytics/indicateurs/calculer-roi/` - Calculer ROI

## 🔧 Configuration

### Variables d'Environnement

#### Développement
```bash
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
```

#### Production
```bash
DEBUG=False
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/location_erp
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### Permissions par Rôle

- **Admin**: Accès complet à tous les modules
- **Gestionnaire**: Biens, Clients, Contrats, Paiements
- **Comptable**: Paiements, Dépenses, Analytics

## 🧪 Tests

### Lancer les tests
```bash
python manage.py test
```

### Tests avec couverture
```bash
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

## 📊 Fonctionnalités Clés

### Gestion Automatisée
- Génération automatique des échéances de paiement
- Détection automatique des retards
- Mise à jour automatique des statuts des biens

### Analyse Financière
- Calcul du ROI en temps réel
- Dashboard avec indicateurs clés
- Projections sur 12 mois
- Rapports mensuels détaillés

### Sécurité
- Authentification JWT sécurisée
- Permissions granulaires par rôle
- Validation des données côté serveur
- Protection CSRF

## 🚀 Déploiement

### Production avec Docker
1. Configurer les variables d'environnement
2. Lancer avec `docker-compose -f docker-compose.prod.yml up`
3. Configurer Nginx pour le reverse proxy

### Backup
```bash
# Base de données
pg_dump location_erp > backup.sql

# Médias
tar -czf media_backup.tar.gz media/
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT - voir le fichier LICENSE pour les détails.

## 📞 Support

Pour toute question ou support technique:
- Email: support@location-erp.com
- Documentation: https://docs.location-erp.com
