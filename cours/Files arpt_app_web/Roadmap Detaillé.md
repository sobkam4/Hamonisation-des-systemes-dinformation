Détail de chaque phase avec sous-tâches, décisions, points d'attention et livrables :

```markdown
# ROADMAP DÉTAILLÉE - BACKEND DJANGO ARPT GUINÉE
## Détail complet de chaque phase de développement

---

## 📦 PHASE 1 : SETUP ET INFRASTRUCTURE
**Durée** : 3-5 jours  
**Objectif** : Mettre en place l'environnement de développement et la structure de base

---

### JOUR 1 : INITIALISATION DU PROJET

#### Matin : Environnement de développement

**Tâche 1.1 : Préparation de l'environnement**
- Vérifier la version de Python installée (minimum 3.9)
- Vérifier que pip est à jour
- Choisir un emplacement pour le projet (ex: `C:\Users\ngtec\Desktop\AP\backend` ou équivalent)
- Créer le dossier principal du projet
- Ouvrir le terminal dans ce dossier

**Décisions à prendre :**
- Nom du dossier du projet (ex: `arpt-backend`, `backend`, `arpt-api`)
- Emplacement du projet (local, serveur de développement)

**Tâche 1.2 : Création de l'environnement virtuel**
- Créer l'environnement virtuel avec `python -m venv venv`
- Activer l'environnement virtuel
  - Windows : `venv\Scripts\activate`
  - Linux/Mac : `source venv/bin/activate`
- Vérifier que l'environnement est actif (le prompt doit afficher `(venv)`)

**Points d'attention :**
- Ne jamais commiter le dossier `venv/` dans Git
- Toujours activer l'environnement virtuel avant de travailler
- Utiliser le même environnement virtuel pour tout le projet

**Tâche 1.3 : Installation des dépendances de base**
- Installer Django 4.2.7 (version LTS stable)
- Installer Django REST Framework 3.14.0
- Installer django-cors-headers 4.3.1 (pour gérer CORS)
- Installer psycopg2-binary 2.9.9 (driver PostgreSQL)
- Installer python-decouple 3.8 (gestion variables d'environnement)
- Installer Pillow 10.1.0 (gestion d'images)
- Installer django-extensions 3.2.3 (outils développement)
- Installer ipython 8.18.1 (shell amélioré)

**Décisions à prendre :**
- Version de Django (recommandé : 4.2 LTS)
- Gestionnaire de versions de paquets (pip, pipenv, poetry)

**Tâche 1.4 : Création du fichier requirements.txt**
- Exécuter `pip freeze > requirements.txt`
- Vérifier que tous les paquets sont listés
- Ajouter un commentaire avec la date de création
- Vérifier les versions installées

**Livrables :**
- Fichier `requirements.txt` avec toutes les dépendances
- Environnement virtuel fonctionnel

#### Après-midi : Création du projet Django

**Tâche 1.5 : Création du projet Django**
- Exécuter `django-admin startproject config .`
- Vérifier la structure créée :
  - Dossier `config/` (configuration du projet)
  - Fichier `manage.py` (utilitaire de gestion)
- Comprendre la structure :
  - `config/settings.py` : Configuration
  - `config/urls.py` : URLs principales
  - `config/wsgi.py` : Interface WSGI
  - `config/asgi.py` : Interface ASGI

**Décisions à prendre :**
- Nom du projet Django (ex: `config`, `backend`, `api`)

**Tâche 1.6 : Premier test du serveur**
- Exécuter `python manage.py runserver`
- Vérifier que le serveur démarre sans erreur
- Accéder à http://127.0.0.1:8000/ dans le navigateur
- Vérifier que la page de bienvenue Django s'affiche
- Arrêter le serveur (Ctrl+C)

**Points d'attention :**
- Le port 8000 est-il disponible ?
- Y a-t-il des erreurs dans la console ?

**Livrables :**
- Projet Django créé et fonctionnel
- Serveur de développement opérationnel

---

### JOUR 2 : CONFIGURATION BASE DE DONNÉES

#### Matin : Installation et configuration PostgreSQL

**Tâche 2.1 : Vérification de PostgreSQL**
- Vérifier si PostgreSQL est installé
- Si non installé, télécharger et installer PostgreSQL 14+
- Vérifier que le service PostgreSQL est démarré
- Tester la connexion avec `psql --version`

**Points d'attention :**
- Noter le mot de passe du superutilisateur PostgreSQL
- Vérifier que le port par défaut (5432) est disponible

**Tâche 2.2 : Création de la base de données**
- Se connecter à PostgreSQL (via psql ou pgAdmin)
- Créer la base de données : `CREATE DATABASE arpt_db;`
- Vérifier l'encodage UTF-8
- Vérifier que la base est créée : `\l` dans psql

**Décisions à prendre :**
- Nom de la base de données (ex: `arpt_db`, `arpt_guinea_db`)
- Encodage (UTF-8 obligatoire)

**Tâche 2.3 : Création de l'utilisateur PostgreSQL**
- Créer un utilisateur dédié : `CREATE USER arpt_user WITH PASSWORD 'secure_password';`
- Configurer l'encodage : `ALTER ROLE arpt_user SET client_encoding TO 'utf8';`
- Configurer l'isolation : `ALTER ROLE arpt_user SET default_transaction_isolation TO 'read committed';`
- Configurer le timezone : `ALTER ROLE arpt_user SET timezone TO 'Africa/Conakry';`
- Accorder les privilèges : `GRANT ALL PRIVILEGES ON DATABASE arpt_db TO arpt_user;`
- Vérifier les privilèges

**Points d'attention :**
- Utiliser un mot de passe fort
- Ne pas utiliser le superutilisateur PostgreSQL pour l'application
- Noter les identifiants dans un endroit sûr (temporairement)

**Livrables :**
- Base de données PostgreSQL créée
- Utilisateur PostgreSQL créé avec les bonnes permissions

#### Après-midi : Configuration Django pour PostgreSQL

**Tâche 2.4 : Configuration de settings.py**
- Ouvrir `config/settings.py`
- Modifier la section DATABASES :
  - Changer ENGINE vers `django.db.backends.postgresql`
  - Configurer NAME, USER, PASSWORD, HOST, PORT
- Utiliser python-decouple pour les valeurs sensibles
- Tester la connexion avec `python manage.py dbshell`

**Décisions à prendre :**
- Host de la base de données (localhost pour dev, IP pour prod)
- Port PostgreSQL (généralement 5432)

**Tâche 2.5 : Création du fichier .env**
- Créer le fichier `.env` à la racine du projet
- Ajouter les variables :
  - SECRET_KEY (générer une nouvelle clé)
  - DEBUG=True
  - ALLOWED_HOSTS
  - DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
- Modifier settings.py pour utiliser python-decouple
- Vérifier que le fichier .env est dans .gitignore

**Points d'attention :**
- Ne JAMAIS commiter le fichier .env
- Générer une SECRET_KEY unique et sécurisée
- Utiliser des valeurs différentes pour dev/prod

**Tâche 2.6 : Migrations initiales**
- Exécuter `python manage.py makemigrations` (devrait être vide au début)
- Exécuter `python manage.py migrate` (migrations Django par défaut)
- Vérifier que les tables sont créées dans PostgreSQL
- Lister les tables créées : `python manage.py showmigrations`

**Livrables :**
- Base de données configurée dans Django
- Migrations initiales appliquées
- Tables Django par défaut créées

**Tâche 2.7 : Création du superutilisateur**
- Exécuter `python manage.py createsuperuser`
- Saisir les informations :
  - Email (utiliser comme username)
  - Password (fort et sécurisé)
  - Confirmer le password
- Vérifier la création dans la base de données
- Tester la connexion à l'admin Django : http://127.0.0.1:8000/admin/

**Livrables :**
- Superutilisateur créé
- Accès à l'admin Django fonctionnel

---

### JOUR 3 : STRUCTURE DES APPS

#### Matin : Création des applications Django

**Tâche 3.1 : Planification des apps**
- Lister toutes les apps nécessaires :
  - accounts (authentification)
  - pages (pages statiques)
  - posts (actualités)
  - documents (documents)
  - contact (contact)
  - operators (opérateurs)
  - regulations (réglementations)
  - media (médias)
  - newsletter (newsletter)
  - forms (formulaires)
- Définir les responsabilités de chaque app

**Tâche 3.2 : Création des apps**
- Créer chaque app avec `python manage.py startapp app_name`
- Créer dans l'ordre :
  1. accounts
  2. pages
  3. posts
  4. documents
  5. contact
  6. operators
  7. regulations
  8. media
  9. newsletter
  10. forms
- Vérifier que chaque app a été créée avec la structure standard :
  - `migrations/` (dossier)
  - `__init__.py`
  - `admin.py`
  - `apps.py`
  - `models.py`
  - `tests.py`
  - `views.py`

**Points d'attention :**
- Nommer les apps au pluriel ou singulier de manière cohérente
- Vérifier qu'il n'y a pas de conflits de noms

**Livrables :**
- 10 applications Django créées
- Structure de base de chaque app en place

#### Après-midi : Configuration des apps et settings

**Tâche 3.3 : Enregistrement des apps dans INSTALLED_APPS**
- Ouvrir `config/settings.py`
- Ajouter toutes les apps dans INSTALLED_APPS :
  - Apps Django par défaut
  - Apps tierces (rest_framework, corsheaders)
  - Toutes les apps locales créées
- Vérifier l'ordre (Django, tierces, locales)
- Vérifier qu'il n'y a pas d'erreurs de syntaxe

**Tâche 3.4 : Configuration Django REST Framework**
- Ajouter la configuration REST_FRAMEWORK dans settings.py :
  - DEFAULT_AUTHENTICATION_CLASSES (JWT - à configurer plus tard)
  - DEFAULT_PERMISSION_CLASSES (IsAuthenticatedOrReadOnly)
  - DEFAULT_PAGINATION_CLASS (PageNumberPagination)
  - PAGE_SIZE (10)
  - DEFAULT_FILTER_BACKENDS (SearchFilter, OrderingFilter)
- Vérifier la configuration

**Tâche 3.5 : Configuration CORS**
- Ajouter corsheaders dans INSTALLED_APPS
- Ajouter CorsMiddleware dans MIDDLEWARE (en haut)
- Configurer CORS_ALLOWED_ORIGINS (liste des origines autorisées)
- Configurer CORS_ALLOW_CREDENTIALS (True)
- Ajouter les variables dans .env

**Décisions à prendre :**
- Quelles origines autoriser en développement ? (localhost:3000, localhost:8000)
- Quelles origines autoriser en production ?

**Tâche 3.6 : Configuration des médias et fichiers statiques**
- Configurer MEDIA_URL et MEDIA_ROOT dans settings.py
- Configurer STATIC_URL et STATIC_ROOT
- Créer les dossiers `media/` et `staticfiles/` à la racine
- Ajouter les dossiers dans .gitignore (sauf structure)

**Tâche 3.7 : Configuration du timezone et langue**
- Configurer LANGUAGE_CODE = 'fr-fr'
- Configurer TIME_ZONE = 'Africa/Conakry'
- Vérifier USE_I18N = True
- Vérifier USE_TZ = True

**Tâche 3.8 : Création du fichier .gitignore**
- Créer/améliorer le fichier .gitignore
- Ajouter :
  - Environnement virtuel (venv/, env/)
  - Fichiers Python compilés (__pycache__/, *.pyc)
  - Base de données SQLite (db.sqlite3)
  - Fichiers d'environnement (.env, .env.local)
  - Médias et fichiers statiques (media/, staticfiles/)
  - Fichiers IDE (.vscode/, .idea/)
  - Fichiers OS (.DS_Store, Thumbs.db)
  - Fichiers de logs (*.log)

**Tâche 3.9 : Test final de la configuration**
- Vérifier que le serveur démarre : `python manage.py runserver`
- Vérifier qu'il n'y a pas d'erreurs dans la console
- Vérifier l'accès à l'admin Django
- Vérifier la connexion à la base de données
- Créer un fichier README.md basique avec les instructions

**Livrables :**
- Toutes les apps enregistrées
- REST Framework configuré
- CORS configuré
- Médias et statiques configurés
- .gitignore complet
- Configuration testée et fonctionnelle

---

### CHECKLIST FINALE PHASE 1

**Environnement :**
- [ ] Python 3.9+ installé
- [ ] Environnement virtuel créé et activé
- [ ] Toutes les dépendances installées
- [ ] requirements.txt créé et à jour

**Projet Django :**
- [ ] Projet Django créé
- [ ] Structure de base vérifiée
- [ ] Serveur de développement fonctionne

**Base de données :**
- [ ] PostgreSQL installé et fonctionnel
- [ ] Base de données créée
- [ ] Utilisateur PostgreSQL créé
- [ ] Connexion Django-PostgreSQL testée
- [ ] Migrations initiales appliquées

**Configuration :**
- [ ] Fichier .env créé et configuré
- [ ] Settings.py configuré (DB, CORS, REST Framework)
- [ ] Toutes les apps créées et enregistrées
- [ ] Médias et statiques configurés
- [ ] Timezone et langue configurés

**Sécurité :**
- [ ] .gitignore créé et complet
- [ ] .env dans .gitignore
- [ ] SECRET_KEY sécurisée
- [ ] Superutilisateur créé

**Documentation :**
- [ ] README.md créé (même basique)
- [ ] Instructions d'installation notées

---

## 🔐 PHASE 2 : AUTHENTIFICATION ET UTILISATEURS
**Durée** : 5-7 jours  
**Objectif** : Système d'authentification JWT complet avec gestion des utilisateurs

---

### JOUR 1-2 : MODÈLE USER PERSONNALISÉ

#### Jour 1 : Installation et configuration JWT

**Tâche 2.1.1 : Installation de djangorestframework-simplejwt**
- Installer le paquet : `pip install djangorestframework-simplejwt`
- Mettre à jour requirements.txt
- Vérifier l'installation

**Tâche 2.1.2 : Configuration JWT dans settings.py**
- Ajouter 'rest_framework_simplejwt' dans INSTALLED_APPS
- Configurer SIMPLE_JWT dans settings.py :
  - ACCESS_TOKEN_LIFETIME : 1 heure
  - REFRESH_TOKEN_LIFETIME : 7 jours
  - ROTATE_REFRESH_TOKENS : True
  - BLACKLIST_AFTER_ROTATION : True
  - UPDATE_LAST_LOGIN : True
  - ALGORITHM : HS256
  - SIGNING_KEY : SECRET_KEY
  - AUTH_HEADER_TYPES : ('Bearer',)
- Ajouter JWT dans REST_FRAMEWORK authentication classes

**Décisions à prendre :**
- Durée de vie du token d'accès (1h recommandé)
- Durée de vie du refresh token (7 jours recommandé)
- Algorithme de signature (HS256 ou RS256)

**Livrables :**
- JWT installé et configuré
- Configuration dans settings.py

#### Jour 2 : Création du modèle User personnalisé

**Tâche 2.2.1 : Analyse des besoins**
- Définir les champs nécessaires :
  - email (unique, comme identifiant principal)
  - password (hashé)
  - first_name, last_name
  - role (admin, editor, viewer, operator)
  - is_active
  - last_login
  - timestamps (created_at, updated_at)
- Définir les rôles et leurs permissions

**Tâche 2.2.2 : Création du modèle User**
- Ouvrir `accounts/models.py`
- Créer la classe User héritant de AbstractUser
- Définir USERNAME_FIELD = 'email'
- Définir REQUIRED_FIELDS = ['username']
- Ajouter le champ role avec choix :
  - admin : Administrateur
  - editor : Éditeur
  - viewer : Lecteur
  - operator : Opérateur
- Ajouter les champs personnalisés
- Définir la Meta class avec :
  - db_table = 'users'
  - verbose_name et verbose_name_plural
- Ajouter la méthode __str__

**Points d'attention :**
- Hériter correctement de AbstractUser
- Email doit être unique
- Role doit avoir une valeur par défaut
- Gérer la compatibilité avec les migrations existantes

**Tâche 2.2.3 : Configuration AUTH_USER_MODEL**
- Modifier settings.py : AUTH_USER_MODEL = 'accounts.User'
- Vérifier qu'il n'y a pas d'autres références à User
- Cette modification doit être faite AVANT toute migration

**Points d'attention :**
- Cette configuration doit être faite avant les migrations
- Ne peut pas être changée après création de la base

**Tâche 2.2.4 : Création et application des migrations**
- Supprimer la base de données si elle existe déjà (ou créer une nouvelle)
- Exécuter `python manage.py makemigrations accounts`
- Vérifier le contenu de la migration
- Exécuter `python manage.py migrate`
- Vérifier que la table users est créée dans PostgreSQL

**Points d'attention :**
- Si la base existe déjà, il faudra peut-être la recréer
- Vérifier que la migration est correcte

**Tâche 2.2.5 : Mise à jour de l'admin Django**
- Modifier `accounts/admin.py`
- Enregistrer le modèle User personnalisé
- Créer une classe UserAdmin personnalisée si nécessaire
- Tester l'accès à l'admin avec le nouveau modèle

**Livrables :**
- Modèle User personnalisé créé
- Migrations créées et appliquées
- Table users dans PostgreSQL
- Admin Django configuré

---

### JOUR 3-4 : SERIALIZERS ET VIEWS D'AUTHENTIFICATION

#### Jour 3 : Création des serializers

**Tâche 2.3.1 : UserSerializer**
- Créer le fichier `accounts/serializers.py`
- Créer UserSerializer :
  - Hériter de ModelSerializer
  - Inclure : id, email, username, first_name, last_name, role, is_active, last_login, created_at
  - Définir read_only_fields : id, last_login, created_at
  - Exclure le password

**Tâche 2.3.2 : RegisterSerializer**
- Créer RegisterSerializer :
  - Inclure : email, username, password, password_confirm, first_name, last_name, role
  - Définir password et password_confirm comme write_only
  - Ajouter validate_password pour validation Django
  - Créer méthode validate pour vérifier que password == password_confirm
  - Créer méthode create pour créer l'utilisateur avec create_user

**Points d'attention :**
- Utiliser create_user pour hasher le password automatiquement
- Valider la force du mot de passe
- Ne pas retourner le password dans la réponse

**Tâche 2.3.3 : ChangePasswordSerializer**
- Créer ChangePasswordSerializer :
  - old_password (required)
  - new_password (required avec validate_password)
  - Créer méthode validate pour vérifier old_password
  - Créer méthode save pour changer le password

**Tâche 2.3.4 : LoginSerializer (optionnel)**
- Créer LoginSerializer si nécessaire :
  - email
  - password
  - Validation basique

**Livrables :**
- Tous les serializers créés
- Validation des données implémentée

#### Jour 4 : Création des vues d'authentification

**Tâche 2.4.1 : Vue Register**
- Créer la fonction register dans `accounts/views.py`
- Décorateur @api_view(['POST'])
- Permission AllowAny
- Valider les données avec RegisterSerializer
- Si valide, créer l'utilisateur
- Générer les tokens JWT (RefreshToken.for_user)
- Retourner user, token, refresh_token
- Gérer les erreurs de validation

**Points d'attention :**
- Générer les tokens après création
- Retourner les bonnes données
- Gérer les erreurs proprement

**Tâche 2.4.2 : Vue Login**
- Créer la fonction login
- Décorateur @api_view(['POST'])
- Permission AllowAny
- Récupérer email et password depuis request.data
- Chercher l'utilisateur par email
- Vérifier le password avec check_password
- Si valide :
  - Mettre à jour last_login
  - Générer les tokens
  - Retourner user, token, refresh_token
- Si invalide, retourner erreur 401

**Points d'attention :**
- Ne pas révéler si l'email existe ou non (sécurité)
- Mettre à jour last_login
- Gérer les cas d'erreur

**Tâche 2.4.3 : Vue Refresh Token**
- Créer la fonction refresh_token
- Décorateur @api_view(['POST'])
- Permission AllowAny
- Récupérer refresh_token depuis request.data
- Valider le token avec RefreshToken
- Générer un nouveau access token
- Retourner nouveau token et refresh_token

**Tâche 2.4.4 : Vue Logout (optionnel)**
- Créer la fonction logout
- Décorateur @api_view(['POST'])
- Permission IsAuthenticated
- Blacklister le token si nécessaire
- Retourner message de succès

**Tâche 2.4.5 : Vues de gestion des utilisateurs**
- Créer UserListView (ListAPIView) :
  - Queryset : User.objects.all()
  - Serializer : UserSerializer
  - Permission : IsAdminUser
- Créer UserDetailView (RetrieveUpdateDestroyAPIView) :
  - Queryset : User.objects.all()
  - Serializer : UserSerializer
  - Permission : IsAdminUser

**Livrables :**
- Toutes les vues d'authentification créées
- Gestion des utilisateurs implémentée

---

### JOUR 5 : PERMISSIONS PERSONNALISÉES

**Tâche 2.5.1 : Création du fichier permissions.py**
- Créer `accounts/permissions.py`
- Importer permissions de rest_framework

**Tâche 2.5.2 : IsAdminOrEditor**
- Créer la classe IsAdminOrEditor héritant de BasePermission
- Implémenter has_permission :
  - Vérifier que l'utilisateur est authentifié
  - Vérifier que role est 'admin' ou 'editor'
  - Retourner True si les deux conditions sont remplies

**Tâche 2.5.3 : IsAdmin**
- Créer la classe IsAdmin
- Implémenter has_permission :
  - Vérifier que l'utilisateur est authentifié
  - Vérifier que role est 'admin'
  - Retourner True si les deux conditions sont remplies

**Tâche 2.5.4 : IsOwnerOrReadOnly**
- Créer la classe IsOwnerOrReadOnly
- Implémenter has_permission (toujours True pour lecture)
- Implémenter has_object_permission :
  - Si méthode SAFE (GET, HEAD, OPTIONS), retourner True
  - Sinon, vérifier que l'utilisateur est le propriétaire ou admin
  - Retourner True si condition remplie

**Tâche 2.5.5 : Application des permissions**
- Appliquer les permissions aux vues créées
- Tester chaque permission avec différents rôles
- Vérifier que les restrictions fonctionnent

**Livrables :**
- Fichier permissions.py créé
- Toutes les permissions personnalisées implémentées
- Permissions testées

---










### JOUR 6-7 : CONFIGURATION URLs ET TESTS

#### Jour 6 : Configuration des URLs

**Tâche 2.6.1 : Création de accounts/urls.py**
- Créer le fichier `accounts/urls.py`
- Importer les vues créées
- Définir app_name = 'accounts'
- Créer urlpatterns avec :
  - register/
  - login/
  - refresh/
  - logout/ (si créé)
  - users/ (liste)
  - users/<int:pk>/ (détail)

**Tâche 2.6.2 : Intégration dans les URLs principales**
- Ouvrir `config/urls.py`
- Ajouter : path('api/auth/', include('accounts.urls'))
- Vérifier qu'il n'y a pas de conflits

**Tâche 2.6.3 : Test des URLs**
- Démarrer le serveur
- Tester chaque URL avec le navigateur (GET) ou Postman
- Vérifier qu'il n'y a pas d'erreurs 404

**Livrables :**
- URLs configurées
- Intégration dans le projet
- URLs accessibles

#### Jour 7 : Tests complets

**Tâche 2.7.1 : Tests avec Postman - Register**
- Créer une collection Postman "ARPT Auth"
- Tester POST /api/auth/register/ :
  - Avec données valides (doit retourner 201)
  - Avec email existant (doit retourner 400)
  - Avec passwords différents (doit retourner 400)
  - Avec données manquantes (doit retourner 400)
- Vérifier que le token est retourné
- Sauvegarder le token pour les tests suivants

**Tâche 2.7.2 : Tests avec Postman - Login**
- Tester POST /api/auth/login/ :
  - Avec identifiants valides (doit retourner 200)
  - Avec email invalide (doit retourner 401)
  - Avec password invalide (doit retourner 401)
  - Avec données manquantes (doit retourner 400)
- Vérifier que les tokens sont retournés
- Vérifier que last_login est mis à jour

**Tâche 2.7.3 : Tests avec Postman - Refresh**
- Tester POST /api/auth/refresh/ :
  - Avec refresh_token valide (doit retourner 200)
  - Avec refresh_token invalide (doit retourner 401)
  - Sans token (doit retourner 400)
- Vérifier que nouveau token est retourné

**Tâche 2.7.4 : Tests avec Postman - Endpoints protégés**
- Tester GET /api/auth/users/ :
  - Sans token (doit retourner 401)
  - Avec token valide mais non-admin (doit retourner 403)
  - Avec token admin (doit retourner 200 avec liste)
- Tester GET /api/auth/users/<id>/ :
  - Avec différents rôles
  - Vérifier les permissions

**Tâche 2.7.5 : Tests avec différents rôles**
- Créer des utilisateurs avec différents rôles via l'admin
- Tester l'accès aux endpoints avec chaque rôle
- Vérifier que les permissions fonctionnent correctement

**Tâche 2.7.6 : Documentation**
- Documenter chaque endpoint :
  - URL
  - Méthode HTTP
  - Paramètres (body, query)
  - Réponses possibles
  - Codes d'erreur
  - Exemples de requêtes/réponses
- Créer un fichier API_DOCUMENTATION.md ou utiliser Swagger (plus tard)

**Livrables :**
- Tous les endpoints testés et fonctionnels
- Collection Postman créée
- Documentation des endpoints

---

### CHECKLIST FINALE PHASE 2

**Modèle User :**
- [ ] Modèle User personnalisé créé
- [ ] AUTH_USER_MODEL configuré
- [ ] Migrations créées et appliquées
- [ ] Table users dans PostgreSQL

**JWT :**
- [ ] djangorestframework-simplejwt installé
- [ ] Configuration JWT dans settings.py
- [ ] Tokens générés correctement

**Serializers :**
- [ ] UserSerializer créé
- [ ] RegisterSerializer créé avec validation
- [ ] ChangePasswordSerializer créé
- [ ] Tous les serializers testés

**Vues :**
- [ ] Vue register fonctionnelle
- [ ] Vue login fonctionnelle
- [ ] Vue refresh_token fonctionnelle
- [ ] Vue logout fonctionnelle (si créée)
- [ ] Vues de gestion utilisateurs fonctionnelles

**Permissions :**
- [ ] IsAdminOrEditor créée
- [ ] IsAdmin créée
- [ ] IsOwnerOrReadOnly créée
- [ ] Permissions appliquées aux vues

**URLs :**
- [ ] accounts/urls.py créé
- [ ] URLs intégrées dans config/urls.py
- [ ] Toutes les URLs accessibles

**Tests :**
- [ ] Tests Postman pour register réussis
- [ ] Tests Postman pour login réussis
- [ ] Tests Postman pour refresh réussis
- [ ] Tests endpoints protégés réussis
- [ ] Tests avec différents rôles réussis

**Documentation :**
- [ ] Endpoints documentés
- [ ] Exemples de requêtes/réponses notés

---

## 📄 PHASE 3 : CORE API - CONTENU
**Durée** : 10-12 jours  
**Objectif** : Implémenter les fonctionnalités de base (Pages, Posts, Categories, Documents)

---

### SEMAINE 3 : PAGES ET CATEGORIES

#### Jour 1-2 : Modèle Category

**Tâche 3.1.1 : Analyse des besoins Category**
- Définir les champs nécessaires :
  - name (unique, obligatoire)
  - slug (unique, généré automatiquement)
  - description (optionnel)
  - parent (relation hiérarchique, optionnel)
  - timestamps
- Définir si les catégories peuvent être hiérarchiques
- Définir les règles de validation

**Tâche 3.1.2 : Création du modèle Category**
- Ouvrir `posts/models.py` (ou créer app categories séparée)
- Créer la classe Category héritant de models.Model
- Ajouter les champs :
  - name : CharField, max_length=100, unique=True
  - slug : SlugField, max_length=100, unique=True, blank=True
  - description : TextField, blank=True, null=True
  - parent : ForeignKey vers 'self', null=True, blank=True, related_name='children'
  - created_at : DateTimeField, auto_now_add=True
  - updated_at : DateTimeField, auto_now=True
- Définir Meta class :
  - verbose_name_plural
  - ordering
- Créer méthode save() pour générer le slug automatiquement
- Créer méthode __str__

**Points d'attention :**
- Slug doit être unique
- Gérer la génération automatique du slug
- Gérer la relation hiérarchique (parent)

**Tâche 3.1.3 : Création du serializer CategorySerializer**
- Créer `posts/serializers.py`
- Créer CategorySerializer :
  - Hériter de ModelSerializer
  - Inclure tous les champs
  - read_only_fields : id, created_at, updated_at
  - slug en read_only (généré automatiquement)

**Tâche 3.1.4 : Création des vues Category**
- Créer CategoryListView (ListCreateAPIView) :
  - Queryset : Category.objects.all()
  - Serializer : CategorySerializer
  - Permission : IsAuthenticatedOrReadOnly (POST nécessite auth)
  - Appliquer IsAdminOrEditor pour POST
- Créer CategoryDetailView (RetrieveUpdateDestroyAPIView) :
  - Queryset : Category.objects.all()
  - Serializer : CategorySerializer
  - Permissions : IsAuthenticatedOrReadOnly (GET), IsAdminOrEditor (PUT/DELETE)

**Tâche 3.1.5 : Configuration URLs Category**
- Créer `posts/urls.py`
- Ajouter les URLs :
  - '' → CategoryListView
  - '<int:pk>/' → CategoryDetailView
- Intégrer dans config/urls.py

**Tâche 3.1.6 : Migrations et tests**
- Exécuter makemigrations
- Vérifier le contenu de la migration
- Exécuter migrate
- Vérifier la table dans PostgreSQL
- Tester les endpoints avec Postman :
  - GET liste (doit retourner liste vide ou catégories)
  - POST création (avec auth)
  - GET détail
  - PUT modification
  - DELETE suppression

**Livrables :**
- Modèle Category créé
- Serializer créé
- Vues CRUD créées
- URLs configurées
- Migrations appliquées
- Endpoints testés

---

#### Jour 3-4 : Modèle Page

**Tâche 3.2.1 : Analyse des besoins Page**
- Définir les champs nécessaires :
  - slug (unique, URL-friendly)
  - title (obligatoire)
  - content (obligatoire, texte long)
  - excerpt (optionnel, résumé)
  - meta_title, meta_description (SEO)
  - status (draft, published, archived)
  - author (relation User)
  - published_at (automatique si published)
  - timestamps
  - deleted_at (soft delete)
- Définir les règles de publication
- Définir les règles de soft delete

**Tâche 3.2.2 : Création du modèle Page**
- Ouvrir `pages/models.py`
- Créer la classe Page
- Ajouter les champs avec les types appropriés
- Définir STATUS_CHOICES
- Ajouter ForeignKey vers User (author)
- Ajouter les index nécessaires (slug, status)
- Créer méthode save() :
  - Générer slug si vide
  - Définir published_at si status devient published
- Créer méthode __str__

**Points d'attention :**
- Slug doit être unique
- published_at ne doit être défini qu'une fois
- Soft delete pour garder l'historique

**Tâche 3.2.3 : Création des serializers Page**
- Créer PageSerializer (complet) :
  - Inclure tous les champs
  - Ajouter author_detail (nested serializer User)
  - read_only_fields appropriés
- Créer PageListSerializer (simplifié pour les listes) :
  - Inclure seulement les champs nécessaires pour la liste
  - Optimiser pour les performances

**Tâche 3.2.4 : Création des vues Page**
- Créer PageListView (ListCreateAPIView) :
  - Queryset avec filtre deleted_at__isnull=True
  - Serializer dynamique (List pour GET, complet pour POST)
  - Filtrage : SearchFilter (title, content, excerpt)
  - Tri : OrderingFilter (created_at, updated_at, published_at)
  - Pagination automatique
  - Permissions : IsAuthenticatedOrReadOnly (GET), IsAdminOrEditor (POST)
  - perform_create : définir author automatiquement
- Créer PageDetailView (RetrieveUpdateDestroyAPIView) :
  - lookup_field = 'slug' (au lieu de pk)
  - Queryset avec filtre deleted_at__isnull=True
  - Permissions : IsAuthenticatedOrReadOnly (GET), IsAdminOrEditor (PUT/DELETE)
  - perform_destroy : soft delete (définir deleted_at et status=archived)

**Tâche 3.2.5 : Configuration URLs Page**
- Créer `pages/urls.py`
- Ajouter les URLs :
  - '' → PageListView
  - '<slug:slug>/' → PageDetailView
- Intégrer dans config/urls.py

**Tâche 3.2.6 : Migrations et tests**
- Exécuter makemigrations pages
- Vérifier la migration
- Exécuter migrate
- Tester tous les endpoints :
  - GET liste (avec pagination, recherche, tri)
  - POST création (avec auth)
  - GET détail par slug
  - PUT modification
  - DELETE (soft delete)
- Vérifier que le soft delete fonctionne

**Livrables :**
- Modèle Page créé
- Serializers créés (complet et liste)
- Vues CRUD avec filtrage
- URLs configurées
- Soft delete implémenté
- Endpoints testés

---

#### Jour 5-7 : Améliorations et intégration

**Tâche 3.3.1 : Optimisation des requêtes**
- Analyser les requêtes générées
- Ajouter select_related pour author
- Optimiser les serializers pour éviter N+1 queries
- Tester les performances

**Tâche 3.3.2 : Ajout d'index**
- Identifier les colonnes fréquemment recherchées
- Ajouter des index dans la Meta class :
  - Index sur (slug, status)
  - Index sur created_at pour le tri
- Créer une migration pour les index
- Appliquer la migration

**Tâche 3.3.3 : Tests complets**
- Tester tous les scénarios :
  - Création avec différents statuts
  - Publication (changement de statut)
  - Recherche avec différents termes
  - Tri par différents champs
  - Pagination
  - Soft delete et restauration
- Tester les permissions avec différents rôles
- Vérifier les validations

**Tâche 3.3.4 : Documentation**
- Documenter les endpoints Pages
- Documenter les paramètres de recherche et tri
- Ajouter des exemples

**Livrables :**
- Requêtes optimisées
- Index ajoutés
- Tests complets réussis
- Documentation mise à jour

---

### SEMAINE 4 : POSTS ET DOCUMENTS

#### Jour 1-3 : Modèle Post

**Tâche 3.4.1 : Analyse des besoins Post**
- Définir les champs :
  - title, slug, content, excerpt
  - featured_image (ImageField)
  - category (ForeignKey vers Category)
  - author (ForeignKey vers User)
  - status (draft, published, archived)
  - views_count (compteur)
  - published_at
  - timestamps
  - deleted_at
- Définir les relations avec Category
- Définir la logique d'incrémentation des vues

**Tâche 3.4.2 : Création du modèle Post**
- Ouvrir `posts/models.py`
- Créer la classe Post
- Ajouter tous les champs
- Ajouter ForeignKey vers Category et User
- Ajouter ImageField pour featured_image
- Ajouter IntegerField pour views_count (default=0)
- Ajouter les index nécessaires
- Créer méthode save() :
  - Générer slug
  - Définir published_at si published
- Créer méthode increment_views() pour incrémenter le compteur
- Créer méthode __str__

**Points d'attention :**
- Gérer l'upload d'images (Pillow nécessaire)
- Configurer upload_to pour organiser les images
- Gérer les cas où category ou author sont supprimés (SET_NULL)

**Tâche 3.4.3 : Configuration des médias pour images**
- Vérifier que MEDIA_ROOT et MEDIA_URL sont configurés
- Configurer upload_to='posts/%Y/%m/' pour organiser par date
- Tester l'upload d'une image

**Tâche 3.4.4 : Création des serializers Post**
- Créer PostSerializer (complet) :
  - Inclure tous les champs
  - Ajouter category_detail (nested CategorySerializer)
  - Ajouter author_detail (nested UserSerializer)
  - featured_image en read_only pour l'URL
- Créer PostListSerializer (simplifié) :
  - Champs essentiels pour la liste
  - category_detail pour afficher la catégorie

**Tâche 3.4.5 : Création des vues Post**
- Créer PostListView (ListCreateAPIView) :
  - Queryset avec filtre deleted_at__isnull=True
  - Filtrage : SearchFilter, OrderingFilter, DjangoFilterBackend
  - Filtres : category, status
  - Recherche : title, content, excerpt
  - Tri : created_at, updated_at, published_at, views_count
  - get_queryset() : filtrer par status='published' si utilisateur non authentifié
  - Permissions : IsAuthenticatedOrReadOnly (GET), IsAdminOrEditor (POST)
  - perform_create : définir author
- Créer PostDetailView (RetrieveUpdateDestroyAPIView) :
  - lookup_field = 'slug'
  - get_queryset() : filtrer par status si non authentifié
  - Override retrieve() : appeler increment_views()
  - Permissions appropriées

**Tâche 3.4.6 : Configuration URLs Post**
- Ajouter les URLs dans `posts/urls.py` :
  - 'posts/' → PostListView
  - 'posts/<slug:slug>/' → PostDetailView
- Intégrer dans config/urls.py

**Tâche 3.4.7 : Migrations et tests**
- Exécuter makemigrations
- Vérifier la migration (notamment ImageField)
- Exécuter migrate
- Tester tous les endpoints :
  - GET liste avec filtres
  - POST création avec image
  - GET détail (vérifier increment_views)
  - PUT modification
  - DELETE
- Tester l'upload d'images
- Vérifier que views_count s'incrémente

**Livrables :**
- Modèle Post créé
- Upload d'images fonctionnel
- Serializers créés
- Vues avec filtrage avancé
- Compteur de vues fonctionnel
- Endpoints testés

---

#### Jour 4-5 : Modèle Document

**Tâche 3.5.1 : Analyse des besoins Document**
- Définir les champs :
  - title, description
  - file (FileField)
  - file_size, file_type (détectés automatiquement)
  - category (report, regulation, form, guide, other)
  - download_count (compteur)
  - is_public (visibilité)
  - uploaded_by (ForeignKey User)
  - timestamps
  - deleted_at
- Définir les types de fichiers autorisés
- Définir la taille maximale

**Tâche 3.5.2 : Création du modèle Document**
- Ouvrir `documents/models.py`
- Créer la classe Document
- Ajouter FileField pour file
- Ajouter CATEGORY_CHOICES
- Ajouter IntegerField pour download_count (default=0)
- Ajouter BooleanField pour is_public (default=True)
- Ajouter ForeignKey vers User
- Créer méthode save() :
  - Détecter file_size et file_type automatiquement
- Créer méthode increment_download()
- Créer méthode __str__

**Points d'attention :**
- Valider le type de fichier (PDF, DOC, etc.)
- Valider la taille (max 10-20 MB)
- Organiser les fichiers par date (upload_to)

**Tâche 3.5.3 : Validation des fichiers**
- Créer un validateur personnalisé pour :
  - Type de fichier (MIME type)
  - Taille maximale
- Appliquer le validateur au FileField
- Tester avec différents types de fichiers

**Tâche 3.5.4 : Création des serializers Document**
- Créer DocumentSerializer :
  - Inclure tous les champs
  - file en read_only pour l'URL de téléchargement
  - Ajouter uploaded_by_detail (nested)
- Créer DocumentListSerializer (simplifié)

**Tâche 3.5.5 : Création des vues Document**
- Créer DocumentListView (ListCreateAPIView) :
  - Filtrage et recherche
  - Filtre par category et is_public
  - Permissions : IsAuthenticatedOrReadOnly (GET), IsAdminOrEditor (POST)
  - Gérer l'upload de fichier
- Créer DocumentDetailView (RetrieveUpdateDestroyAPIView)
- Créer DocumentDownloadView (APIView) :
  - Récupérer le document
  - Vérifier is_public ou permissions
  - Appeler increment_download()
  - Retourner le fichier en réponse
  - Headers appropriés pour le téléchargement

**Tâche 3.5.6 : Configuration URLs Document**
- Ajouter les URLs dans `documents/urls.py` :
  - '' → DocumentListView
  - '<int:pk>/' → DocumentDetailView
  - '<int:pk>/download/' → DocumentDownloadView
- Intégrer dans config/urls.py

**Tâche 3.5.7 : Migrations et tests**
- Exécuter makemigrations
- Exécuter migrate
- Tester tous les endpoints :
  - GET liste
  - POST upload (avec fichier valide et invalide)
  - GET détail
  - GET download (vérifier increment_download)
  - PUT modification
  - DELETE
- Tester la validation des fichiers
- Tester les permissions

**Livrables :**
- Modèle Document créé
- Validation des fichiers implémentée
- Upload de fichiers fonctionnel
- Téléchargement avec compteur fonctionnel
- Endpoints testés

---

#### Jour 6-7 : Intégration et optimisation

**Tâche 3.6.1 : Tests d'intégration**
- Tester l'intégration entre Posts et Categories
- Tester l'intégration entre Documents et Users
- Vérifier que les relations fonctionnent correctement
- Tester les cas limites (suppression de category, etc.)

**Tâche 3.6.2 : Optimisation des requêtes**
- Analyser les requêtes pour Posts (avec category, author)
- Ajouter select_related pour ForeignKey
- Ajouter prefetch_related si nécessaire
- Optimiser les serializers pour éviter N+1

**Tâche 3.6.3 : Ajout d'index**
- Identifier les colonnes fréquemment recherchées
- Ajouter des index :
  - Posts : (slug, status), (category, status)
  - Documents : (category, is_public)
- Créer et appliquer les migrations

**Tâche 3.6.4 : Tests de performance**
- Tester les temps de réponse
- Vérifier que la pagination fonctionne
- Vérifier que les recherches sont rapides
- Optimiser si nécessaire

**Tâche 3.6.5 : Documentation complète**
- Documenter tous les endpoints créés
- Documenter les paramètres de filtrage
- Documenter les formats de réponse
- Ajouter des exemples

**Livrables :**
- Intégration testée
- Requêtes optimisées
- Index ajoutés
- Performance vérifiée
- Documentation complète

---

### CHECKLIST FINALE PHASE 3

**Categories :**
- [ ] Modèle Category créé
- [ ] Serializer créé
- [ ] Vues CRUD créées
- [ ] URLs configurées
- [ ] Migrations appliquées
- [ ] Endpoints testés

**Pages :**
- [ ] Modèle Page créé avec tous les champs
- [ ] Serializers créés (complet et liste)
- [ ] Vues avec filtrage et recherche
- [ ] Soft delete implémenté
- [ ] URLs configurées
- [ ] Migrations appliquées
- [ ] Endpoints testés

**Posts :**
- [ ] Modèle Post créé
- [ ] Upload d'images fonctionnel
- [ ] Serializers créés
- [ ] Vues avec filtrage avancé
- [ ] Compteur de vues fonctionnel
- [ ] URLs configurées
- [ ] Migrations appliquées
- [ ] Endpoints testés

**Documents :**
- [ ] Modèle Document créé
- [ ] Validation des fichiers implémentée
- [ ] Upload fonctionnel
- [ ] Téléchargement avec compteur
- [ ] Serializers créés
- [ ] Vues créées
- [ ] URLs configurées
- [ ] Migrations appliquées
- [ ] Endpoints testés

**Optimisation :**
- [ ] Requêtes optimisées (select_related, prefetch_related)
- [ ] Index ajoutés
- [ ] Performance vérifiée

**Documentation :**
- [ ] Tous les endpoints documentés
- [ ] Exemples ajoutés

---

## 📧 PHASE 4 : FONCTIONNALITÉS AVANCÉES
**Durée** : 8-10 jours  
**Objectif** : Contact, Médias, Newsletter, Recherche

---

### SEMAINE 5 : CONTACT ET MÉDIAS

#### Jour 1-2 : Modèle Contact

**Tâche 4.1.1 : Analyse des besoins Contact**
- Définir les champs :
  - name, email, subject, message
  - status (new, read, replied, archived)
  - replied_at, replied_by
  - timestamps
- Définir le workflow de traitement
- Définir les notifications email

**Tâche 4.1.2 : Création du modèle ContactMessage**
- Ouvrir `contact/models.py`
- Créer la classe ContactMessage
- Ajouter tous les champs
- Définir STATUS_CHOICES
- Ajouter ForeignKey vers User (replied_by, nullable)
- Créer méthode __str__

**Tâche 4.1.3 : Création des serializers**
- Créer ContactMessageSerializer (pour admin)
- Créer ContactMessageCreateSerializer (pour public, sans status)

**Tâche 4.1.4 : Création des vues**
- Créer ContactCreateView (CreateAPIView) :
  - Permission : AllowAny (public)
  - Envoyer email de notification après création
- Créer ContactMessageListView (ListAPIView) :
  - Permission : IsAdminOrEditor
  - Filtrage par status
- Créer ContactMessageDetailView (RetrieveUpdateAPIView) :
  - Permission : IsAdminOrEditor
  - Mise à jour du status
- Créer ContactMessageStatusView (UpdateAPIView) :
  - Pour changer uniquement le status

**Tâche 4.1.5 : Service d'envoi d'email**
- Créer `utils/email_service.py`
- Créer fonction send_contact_notification()
- Configurer les paramètres email dans settings.py
- Tester l'envoi d'email

**Tâche 4.1.6 : Configuration URLs et tests**
- Créer `contact/urls.py`
- Ajouter les URLs
- Intégrer dans config/urls.py
- Exécuter migrations
- Tester tous les endpoints
- Tester l'envoi d'email

**Livrables :**
- Modèle ContactMessage créé
- Vues créées (public et admin)
- Service d'email fonctionnel
- Endpoints testés

---

#### Jour 3-4 : Gestion des médias

**Tâche 4.2.1 : Analyse des besoins Media**
- Définir les champs :
  - filename, original_filename
  - file (ImageField)
  - file_type, file_size
  - width, height (pour images)
  - alt_text
  - uploaded_by
  - timestamps
- Définir les types de fichiers supportés
- Définir la détection automatique des dimensions

**Tâche 4.2.2 : Création du modèle Media**
- Ouvrir `media/models.py`
- Créer la classe Media
- Ajouter ImageField
- Créer méthode save() :
  - Détecter width et height avec Pillow
  - Détecter file_size et file_type
- Créer méthode __str__

**Tâche 4.2.3 : Création des serializers**
- Créer MediaSerializer avec :
  - file en read_only pour l'URL
  - uploaded_by_detail (nested)

**Tâche 4.2.4 : Création des vues**
- Créer MediaListView (ListCreateAPIView) :
  - Filtrage par type
  - Recherche par filename
  - Permission : IsAdminOrEditor pour POST
- Créer MediaDetailView (RetrieveDestroyAPIView)
- Créer MediaUploadView (CreateAPIView) :
  - Gérer l'upload
  - Valider le type de fichier
  - Générer thumbnail si nécessaire (optionnel)

**Tâche 4.2.5 : Configuration URLs et tests**
- Créer `media/urls.py`
- Ajouter les URLs
- Intégrer dans config/urls.py
- Exécuter migrations
- Tester l'upload d'images
- Vérifier la détection des dimensions
- Tester la suppression

**Livrables :**
- Modèle Media créé
- Upload d'images fonctionnel
- Détection automatique des dimensions
- Endpoints testés

---

#### Jour 5-6 : Newsletter

**Tâche 4.3.1 : Analyse des besoins Newsletter**
- Définir les champs :
  - email (unique)
  - status (active, unsubscribed)
  - token (UUID pour désinscription)
  - subscribed_at, unsubscribed_at
- Définir le processus d'abonnement
- Définir le processus de désabonnement

**Tâche 4.3.2 : Création du modèle NewsletterSubscriber**
- Ouvrir `newsletter/models.py`
- Créer la classe NewsletterSubscriber
- Ajouter email (unique)
- Ajouter status avec choix
- Ajouter token (UUIDField, généré automatiquement)
- Créer méthode __str__

**Tâche 4.3.3 : Création des serializers**
- Créer NewsletterSubscribeSerializer (email seulement)
- Créer NewsletterUnsubscribeSerializer (email et token)
- Créer NewsletterSubscriberSerializer (pour admin)

**Tâche 4.3.4 : Création des vues**
- Créer NewsletterSubscribeView (CreateAPIView) :
  - Permission : AllowAny
  - Vérifier si email existe déjà
  - Créer ou réactiver l'abonnement
  - Envoyer email de confirmation
- Créer NewsletterUnsubscribeView (UpdateAPIView) :
  - Permission : AllowAny
  - Vérifier le token
  - Changer status à unsubscribed
  - Définir unsubscribed_at
- Créer NewsletterSubscriberListView (ListAPIView) :
  - Permission : IsAdmin
  - Filtrage par status

**Tâche 4.3.5 : Configuration URLs et tests**
- Créer `newsletter/urls.py`
- Ajouter les URLs
- Intégrer dans config/urls.py
- Exécuter migrations
- Tester l'abonnement
- Tester le désabonnement avec token
- Tester la liste (admin)

**Livrables :**
- Modèle NewsletterSubscriber créé
- Abonnement fonctionnel
- Désabonnement avec token fonctionnel
- Endpoints testés

---







### SEMAINE 6 : RECHERCHE ET EMAIL

#### Jour 1-2 : Service de recherche globale

**Tâche 4.4.1 : Analyse des besoins Recherche**
- Définir les modèles à rechercher :
  - Pages (title, content)
  - Posts (title, content, excerpt)
  - Documents (title, description)
- Définir les paramètres :
  - q (terme de recherche)
  - type (all, pages, posts, documents)
  - pagination
- Définir le format de réponse

**Tâche 4.4.2 : Création de la vue de recherche**
- Créer app `search` ou ajouter dans utils
- Créer fonction global_search() :
  - Récupérer le paramètre q
  - Récupérer le paramètre type
  - Rechercher dans Pages (si type=all ou type=pages)
  - Rechercher dans Posts (si type=all ou type=posts)
  - Rechercher dans Documents (si type=all ou type=documents)
  - Filtrer par status='published' pour non-authentifiés
  - Utiliser Q objects pour recherche case-insensitive
  - Limiter les résultats (10 par type)
  - Sérialiser les résultats
  - Retourner format unifié

**Tâche 4.4.3 : Optimisation de la recherche**
- Utiliser des index full-text si PostgreSQL
- Optimiser les requêtes
- Ajouter pagination si nécessaire

**Tâche 4.4.4 : Configuration URL et tests**
- Ajouter URL dans config/urls.py :
  - 'api/search/' → global_search
- Tester avec différents termes
- Tester avec différents types
- Vérifier les performances

**Livrables :**
- Service de recherche globale créé
- Recherche dans Pages, Posts, Documents
- Endpoint testé

---

#### Jour 3-4 : Configuration Email

**Tâche 4.5.1 : Configuration SMTP dans settings.py**
- Ajouter configuration EMAIL_BACKEND
- Ajouter EMAIL_HOST, EMAIL_PORT, EMAIL_USE_TLS
- Ajouter EMAIL_HOST_USER, EMAIL_HOST_PASSWORD
- Ajouter DEFAULT_FROM_EMAIL
- Ajouter les variables dans .env

**Tâche 4.5.2 : Choix du service email**
- Décider du service (Gmail, SendGrid, Mailgun, etc.)
- Configurer les identifiants
- Tester la connexion SMTP

**Tâche 4.5.3 : Création du service d'email réutilisable**
- Créer `utils/email_service.py`
- Créer fonction send_email() générique
- Créer fonction send_contact_notification()
- Créer fonction send_newsletter_confirmation()
- Créer fonction send_password_reset() (si nécessaire)

**Tâche 4.5.4 : Création de templates d'email ou envoyer par API au frontend**
- Créer dossier `templates/emails/`
- Créer template contact_notification.html
- Créer template newsletter_confirmation.html
- Créer versions texte si nécessaire

**Tâche 4.5.5 : Tests d'envoi d'email**
- Tester l'envoi d'email simple
- Tester avec template HTML
- Tester depuis les vues (contact, newsletter)
- Vérifier la réception

**Livrables :**
- Configuration email complète
- Service d'email réutilisable
- Templates d'email créés
- Envoi d'email testé

---

#### Jour 5-6 : Intégration Email

**Tâche 4.6.1 : Intégration dans Contact**
- Modifier ContactCreateView pour envoyer email
- Tester l'envoi après création d'un message
- Vérifier que l'email est reçu

**Tâche 4.6.2 : Intégration dans Newsletter**
- Modifier NewsletterSubscribeView pour envoyer confirmation
- Tester l'envoi après abonnement
- Vérifier le contenu de l'email

**Tâche 4.6.3 : File d'attente pour emails (optionnel)**
- Décider si nécessaire (pour production)
- Si oui, configurer Celery ou équivalent
- Implémenter l'envoi asynchrone

**Tâche 4.6.4 : Tests complets**
- Tester tous les scénarios d'envoi d'email
- Vérifier les cas d'erreur
- Vérifier les logs

**Livrables :**
- Email intégré dans Contact
- Email intégré dans Newsletter
- Tous les tests réussis

---

### CHECKLIST FINALE PHASE 4

**Contact :**
- [ ] Modèle ContactMessage créé
- [ ] Vues créées (public et admin)
- [ ] Service d'email fonctionnel
- [ ] Intégration email testée
- [ ] Endpoints testés

**Media :**
- [ ] Modèle Media créé
- [ ] Upload d'images fonctionnel
- [ ] Détection dimensions automatique
- [ ] Endpoints testés

**Newsletter :**
- [ ] Modèle NewsletterSubscriber créé
- [ ] Abonnement fonctionnel
- [ ] Désabonnement avec token fonctionnel
- [ ] Email de confirmation fonctionnel
- [ ] Endpoints testés

**Recherche :**
- [ ] Service de recherche globale créé
- [ ] Recherche dans tous les modèles
- [ ] Endpoint testé

**Email :**
- [ ] Configuration SMTP complète
- [ ] Service d'email réutilisable
- [ ] Templates créés
- [ ] Intégration dans toutes les fonctionnalités
- [ ] Tests d'envoi réussis

---
















## 🏢 PHASE 5 : ESPACE OPÉRATEURS
**Durée** : 7-10 jours  
**Objectif** : Gestion des opérateurs, licences, formulaires dynamiques

---

### SEMAINE 7 : OPÉRATEURS ET LICENCES

#### Jour 1-3 : Modèles Operator et License

**Tâche 5.1.1 : Analyse des besoins Operator**
- Définir les champs :
  - name, email (unique), phone, address
  - license_number (unique, optionnel)
  - license_type (telecom, postal, both)
  - status (active, suspended, revoked)
  - user (OneToOne avec User, optionnel)
  - timestamps
- Définir les relations avec User
- Définir les règles de validation

**Tâche 5.1.2 : Création du modèle Operator**
- Ouvrir `operators/models.py`
- Créer la classe Operator
- Ajouter tous les champs
- Définir LICENSE_TYPE_CHOICES et STATUS_CHOICES
- Ajouter OneToOneField vers User (nullable)
- Créer méthode __str__

**Tâche 5.1.3 : Analyse des besoins License**
- Définir les champs :
  - operator (ForeignKey vers Operator)
  - license_type (telecom, postal)
  - license_number (unique)
  - issued_date, expiry_date
  - status (active, expired, revoked)
  - document (FileField, optionnel)
  - timestamps
- Définir la logique d'expiration automatique

**Tâche 5.1.4 : Création du modèle License**
- Ouvrir `operators/models.py`
- Créer la classe License
- Ajouter tous les champs
- Ajouter ForeignKey vers Operator
- Ajouter FileField pour document
- Créer méthode save() :
  - Vérifier expiry_date > issued_date
  - Définir status='expired' si expiry_date < today
- Créer méthode check_expiry() pour vérifier l'expiration
- Créer méthode __str__

**Tâche 5.1.5 : Création des serializers**
- Créer OperatorSerializer :
  - Inclure tous les champs
  - Ajouter user_detail (nested, read_only)
  - Ajouter licenses (liste des licences, read_only)
- Créer LicenseSerializer :
  - Inclure tous les champs
  - Ajouter operator_detail (nested, read_only)

**Tâche 5.1.6 : Création des vues Operator**
- Créer OperatorListView (ListCreateAPIView) :
  - Filtrage par status, license_type
  - Recherche par name, email
  - Permission : IsAuthenticatedOrReadOnly (GET), IsAdmin (POST)
- Créer OperatorDetailView (RetrieveUpdateDestroyAPIView) :
  - Permission : IsAdmin (PUT/DELETE)
  - Opérateur peut voir ses propres infos (si user lié)
- Créer OperatorMyProfileView (RetrieveAPIView) :
  - Pour qu'un opérateur voie son propre profil
  - Permission : IsAuthenticated

**Tâche 5.1.7 : Création des vues License**
- Créer LicenseListView (ListCreateAPIView) :
  - Filtrage par operator, status, license_type
  - Permission : IsAuthenticatedOrReadOnly (GET), IsAdmin (POST)
- Créer LicenseDetailView (RetrieveUpdateDestroyAPIView) :
  - Permission : IsAdmin
- Créer LicenseExpiredListView (ListAPIView) :
  - Liste des licences expirées
  - Permission : IsAdmin

**Tâche 5.1.8 : Tâche périodique pour expiration (optionnel)**
- Créer une commande Django pour vérifier les expirations
- Configurer un cron job ou Celery beat
- Tester la détection d'expiration

**Tâche 5.1.9 : Configuration URLs et tests**
- Créer `operators/urls.py`
- Ajouter toutes les URLs
- Intégrer dans config/urls.py
- Exécuter migrations
- Tester tous les endpoints
- Tester les permissions
- Tester la logique d'expiration

**Livrables :**
- Modèles Operator et License créés
- Serializers créés
- Vues CRUD créées
- Logique d'expiration implémentée
- Endpoints testés

---





















#### Jour 4-7 : Formulaires dynamiques

**Tâche 5.2.1 : Analyse des besoins Form**
- Définir les champs :
  - name, slug (unique), description
  - fields (JSONField pour structure des champs)
  - is_active
  - timestamps
- Définir la structure JSON pour fields :
  - Type de champ (text, email, number, select, etc.)
  - Label, name, required, validation
- Définir les besoins de FormSubmission

**Tâche 5.2.2 : Analyse des besoins FormSubmission**
- Définir les champs :
  - form (ForeignKey vers Form)
  - data (JSONField pour données soumises)
  - status (pending, processed, rejected)
  - submitted_by (ForeignKey User, optionnel)
  - processed_by (ForeignKey User, optionnel)
  - processed_at
  - timestamps
- Définir le workflow de traitement

**Tâche 5.2.3 : Création du modèle Form**
- Ouvrir `forms/models.py`
- Créer la classe Form
- Ajouter les champs
- Ajouter JSONField pour fields
- Créer méthode save() pour générer slug
- Créer méthode validate_structure() pour valider le JSON
- Créer méthode __str__

**Tâche 5.2.4 : Création du modèle FormSubmission**
- Ouvrir `forms/models.py`
- Créer la classe FormSubmission
- Ajouter tous les champs
- Ajouter ForeignKey vers Form et User (2x)
- Ajouter JSONField pour data
- Créer méthode __str__

**Tâche 5.2.5 : Création des serializers**
- Créer FormSerializer :
  - Inclure tous les champs
  - Valider la structure JSON de fields
- Créer FormSubmissionSerializer :
  - Inclure tous les champs
  - Valider data selon la structure du form
- Créer FormSubmissionCreateSerializer :
  - Pour la soumission publique
  - Validation dynamique basée sur form.fields

**Tâche 5.2.6 : Validation dynamique**
- Créer fonction validate_form_data() :
  - Prendre form et data en paramètres
  - Parcourir form.fields
  - Valider chaque champ selon sa définition
  - Vérifier required, type, format
  - Retourner erreurs si invalide
- Intégrer dans le serializer

**Tâche 5.2.7 : Création des vues Form**
- Créer FormListView (ListAPIView) :
  - Filtrer par is_active=True
  - Permission : AllowAny (formulaires publics)
- Créer FormDetailView (RetrieveAPIView) :
  - Retourner la structure du formulaire
  - Permission : AllowAny
- Créer FormCreateView (CreateAPIView) :
  - Pour créer de nouveaux formulaires
  - Permission : IsAdmin

**Tâche 5.2.8 : Création des vues FormSubmission**
- Créer FormSubmissionCreateView (CreateAPIView) :
  - Permission : AllowAny (ou IsAuthenticated selon besoin)
  - Valider data avec validate_form_data()
  - Créer la soumission
  - Envoyer notification email si nécessaire
- Créer FormSubmissionListView (ListAPIView) :
  - Filtrage par form, status
  - Permission : IsAdminOrEditor
- Créer FormSubmissionDetailView (RetrieveUpdateAPIView) :
  - Permission : IsAdminOrEditor
- Créer FormSubmissionStatusView (UpdateAPIView) :
  - Pour changer uniquement le status
  - Définir processed_by et processed_at

**Tâche 5.2.9 : Configuration URLs et tests**
- Créer `forms/urls.py`
- Ajouter toutes les URLs
- Intégrer dans config/urls.py
- Exécuter migrations
- Tester la création d'un formulaire
- Tester la soumission avec données valides
- Tester la soumission avec données invalides
- Tester la validation dynamique
- Tester le changement de status

**Livrables :**
- Modèles Form et FormSubmission créés
- Validation dynamique implémentée
- Serializers créés
- Vues créées
- Endpoints testés

---

### CHECKLIST FINALE PHASE 5

**Operators :**
- [ ] Modèle Operator créé
- [ ] Modèle License créé
- [ ] Serializers créés
- [ ] Vues CRUD créées
- [ ] Logique d'expiration implémentée
- [ ] Permissions configurées
- [ ] Endpoints testés

**Forms :**
- [ ] Modèle Form créé
- [ ] Modèle FormSubmission créé
- [ ] Validation dynamique implémentée
- [ ] Serializers créés
- [ ] Vues créées
- [ ] Endpoints testés

---






























## 🧪 PHASE 6 : TESTS ET OPTIMISATION
**Durée** : 7-10 jours  
**Objectif** : Tests complets, optimisation des performances, sécurité

---

### SEMAINE 8 : TESTS

#### Jour 1-3 : Tests unitaires

**Tâche 6.1.1 : Configuration des tests**
- Vérifier que les tests Django sont configurés
- Créer une base de données de test
- Configurer les fixtures si nécessaire

**Tâche 6.1.2 : Tests du modèle User**
- Créer `accounts/tests.py`
- Tester la création d'utilisateur
- Tester la validation de l'email unique
- Tester les rôles
- Tester les méthodes du modèle

**Tâche 6.1.3 : Tests des serializers**
- Tester UserSerializer
- Tester RegisterSerializer (validation password)
- Tester tous les serializers créés
- Tester les validations personnalisées

**Tâche 6.1.4 : Tests des vues d'authentification**
- Tester register avec données valides
- Tester register avec données invalides
- Tester login avec identifiants valides
- Tester login avec identifiants invalides
- Tester refresh_token
- Tester les endpoints protégés

**Tâche 6.1.5 : Tests des modèles de contenu**
- Tester Page (création, slug, soft delete)
- Tester Post (création, increment_views)
- Tester Document (upload, increment_download)
- Tester Category (hiérarchie)
- Tester tous les modèles

**Tâche 6.1.6 : Tests des vues de contenu**
- Tester PageListView (liste, pagination, recherche)
- Tester PageDetailView (récupération, modification, suppression)
- Tester PostListView et PostDetailView
- Tester DocumentListView et DocumentDownloadView
- Tester toutes les vues

**Tâche 6.1.7 : Tests des permissions**
- Tester IsAdminOrEditor
- Tester IsAdmin
- Tester IsOwnerOrReadOnly
- Tester avec différents rôles d'utilisateurs

**Tâche 6.1.8 : Tests des fonctionnalités avancées**
- Tester ContactMessage (création, statuts)
- Tester Media (upload, dimensions)
- Tester Newsletter (abonnement, désabonnement)
- Tester la recherche globale

**Tâche 6.1.9 : Tests des opérateurs et formulaires**
- Tester Operator (création, relations)
- Tester License (expiration)
- Tester Form (création, structure JSON)
- Tester FormSubmission (validation dynamique)

**Tâche 6.1.10 : Rapport de couverture**
- Installer coverage : `pip install coverage`
- Exécuter : `coverage run --source='.' manage.py test`
- Générer rapport : `coverage report`
- Générer HTML : `coverage html`
- Vérifier que la couverture est > 80%
- Identifier les zones non testées

**Livrables :**
- Tests unitaires pour tous les modèles
- Tests pour tous les serializers
- Tests pour toutes les vues
- Rapport de couverture > 80%

---
















#### Jour 4-5 : Tests d'intégration

**Tâche 6.2.1 : Tests de workflow complet**
- Tester workflow d'authentification complet :
  - Register → Login → Refresh → Accès protégé
- Tester workflow de création de contenu :
  - Créer Category → Créer Post avec Category → Publier
- Tester workflow de formulaire :
  - Créer Form → Soumettre FormSubmission → Traiter

**Tâche 6.2.2 : Tests d'intégration entre modèles**
- Tester relation User-Post (suppression user)
- Tester relation Category-Post (suppression category)
- Tester relation Operator-License
- Tester toutes les relations

**Tâche 6.2.3 : Tests de scénarios d'erreur**
- Tester les cas limites
- Tester les erreurs de validation
- Tester les erreurs de permissions
- Tester les erreurs de base de données

**Tâche 6.2.4 : Tests de performance**
- Tester les temps de réponse
- Identifier les endpoints lents
- Tester avec beaucoup de données

**Livrables :**
- Tests d'intégration créés
- Tous les workflows testés
- Scénarios d'erreur testés

---

#### Jour 6-7 : Optimisation

**Tâche 6.3.1 : Analyse des requêtes SQL**
- Activer le logging SQL dans settings.py
- Exécuter les endpoints et analyser les requêtes
- Identifier les requêtes N+1
- Identifier les requêtes lentes

**Tâche 6.3.2 : Optimisation avec select_related**
- Ajouter select_related pour toutes les ForeignKey
- Exemples :
  - Post.objects.select_related('author', 'category')
  - Document.objects.select_related('uploaded_by')
- Tester les améliorations

**Tâche 6.3.3 : Optimisation avec prefetch_related**
- Ajouter prefetch_related pour les ManyToMany ou relations inverses
- Tester les améliorations

**Tâche 6.3.4 : Optimisation des serializers**
- Utiliser SerializerMethodField avec cache si nécessaire
- Éviter les requêtes dans les serializers
- Optimiser les nested serializers

**Tâche 6.3.5 : Ajout d'index**
- Identifier les colonnes fréquemment recherchées
- Ajouter des index dans les Meta classes :
  - Index sur (slug, status)
  - Index sur (category, status)
  - Index sur created_at pour le tri
- Créer et appliquer les migrations

**Tâche 6.3.6 : Implémentation du cache (si nécessaire)**
- Décider si le cache est nécessaire
- Si oui, installer et configurer Redis
- Implémenter le cache pour :
  - Listes fréquemment accédées
  - Données statiques
- Configurer l'expiration du cache

**Tâche 6.3.7 : Tests de performance après optimisation**
- Comparer les temps avant/après
- Vérifier que les améliorations sont significatives
- Documenter les optimisations

**Tâche 6.3.8 : Audit de sécurité**
- Vérifier toutes les permissions
- Vérifier la validation des données
- Vérifier la protection contre les injections SQL (ORM)
- Vérifier la protection XSS (sanitization)
- Vérifier la gestion des fichiers uploadés
- Vérifier les tokens JWT
- Vérifier CORS
- Vérifier les secrets (pas dans le code)

**Livrables :**
- Requêtes optimisées
- Index ajoutés
- Cache implémenté (si nécessaire)
- Performance améliorée
- Audit de sécurité effectué

---














### CHECKLIST FINALE PHASE 6

**Tests :**
- [ ] Tests unitaires pour tous les modèles
- [ ] Tests pour tous les serializers
- [ ] Tests pour toutes les vues
- [ ] Tests d'intégration créés
- [ ] Couverture de code > 80%
- [ ] Tous les tests passent

**Optimisation :**
- [ ] Requêtes optimisées (select_related, prefetch_related)
- [ ] Index ajoutés
- [ ] Cache implémenté (si nécessaire)
- [ ] Performance améliorée

**Sécurité :**
- [ ] Audit de sécurité effectué
- [ ] Toutes les vulnérabilités corrigées

---

## 📚 PHASE 7 : DOCUMENTATION ET DÉPLOIEMENT
**Durée** : 5-7 jours  
**Objectif** : Documentation complète, déploiement en production

---

### SEMAINE 9-10 : DOCUMENTATION

#### Jour 1-2 : Documentation API (Swagger)

**Tâche 7.1.1 : Installation de drf-yasg**
- Installer : `pip install drf-yasg`
- Mettre à jour requirements.txt

**Tâche 7.1.2 : Configuration Swagger**
- Ajouter 'drf_yasg' dans INSTALLED_APPS
- Configurer schema_view dans urls.py :
  - Titre : "ARPT Guinea API"
  - Version : "v1"
  - Description complète
  - Public : True
- Ajouter les URLs :
  - 'swagger/' → schema_view.with_ui('swagger')
  - 'redoc/' → schema_view.with_ui('redoc')
  - 'swagger.json' → schema_view.without_ui()

**Tâche 7.1.3 : Amélioration de la documentation**
- Ajouter des descriptions aux serializers (help_text)
- Ajouter des descriptions aux vues (docstrings)
- Ajouter des exemples de réponses
- Configurer l'authentification dans Swagger

**Tâche 7.1.4 : Test de Swagger**
- Accéder à /swagger/
- Vérifier que tous les endpoints sont listés
- Tester l'authentification depuis Swagger
- Tester quelques endpoints depuis Swagger
- Vérifier que les descriptions s'affichent

**Livrables :**
- Swagger installé et configuré
- Tous les endpoints documentés
- Documentation accessible et testée

---

#### Jour 3-4 : README et guides

**Tâche 7.2.1 : Création du README.md**
- Structure du README :
  - Titre et description du projet
  - Prérequis (Python, PostgreSQL, etc.)
  - Installation étape par étape
  - Configuration (variables d'environnement)
  - Commandes utiles
  - Structure du projet
  - Contribution (si open source)
  - Licence
- Rendre le README complet et clair

**Tâche 7.2.2 : Guide de déploiement**
- Créer DEPLOYMENT.md avec :
  - Configuration production
  - Variables d'environnement production
  - Configuration serveur web (Nginx)
  - Configuration WSGI (Gunicorn)
  - Configuration SSL/HTTPS
  - Configuration base de données production
  - Migrations en production
  - Collecte des fichiers statiques
  - Démarrage des services
  - Vérifications post-déploiement

**Tâche 7.2.3 : Guide d'administration**
- Créer ADMIN_GUIDE.md avec :
  - Gestion des utilisateurs
  - Gestion du contenu (Pages, Posts)
  - Gestion des documents
  - Gestion des opérateurs et licences
  - Gestion des formulaires
  - Procédures de backup
  - Procédures de restauration
  - Monitoring et logs

**Tâche 7.2.4 : Documentation de l'architecture**
- Créer ARCHITECTURE.md avec :
  - Diagramme de l'architecture
  - Description des apps
  - Description des modèles et relations
  - Flux de données
  - Technologies utilisées

**Livrables :**
- README.md complet
- Guide de déploiement créé
- Guide d'administration créé
- Documentation d'architecture créée

---

#### Jour 5-7 : Déploiement

**Tâche 7.3.1 : Préparation de l'environnement production**
- Configurer les variables d'environnement production :
  - DEBUG=False
  - SECRET_KEY unique et sécurisée
  - ALLOWED_HOSTS avec le domaine
  - Paramètres de base de données production
  - Paramètres email production
  - CORS_ALLOWED_ORIGINS avec le domaine frontend
- Vérifier toutes les variables

**Tâche 7.3.2 : Configuration de la base de données production**
- Créer la base de données production
- Créer l'utilisateur PostgreSQL production
- Configurer les permissions
- Tester la connexion

**Tâche 7.3.3 : Configuration du serveur web (Nginx)**
- Installer Nginx
- Créer la configuration :
  - Reverse proxy vers Gunicorn
  - Configuration des fichiers statiques
  - Configuration des fichiers médias
  - Configuration SSL/HTTPS
  - Headers de sécurité
- Tester la configuration

**Tâche 7.3.4 : Configuration Gunicorn**
- Installer Gunicorn : `pip install gunicorn`
- Créer le fichier de configuration gunicorn_config.py
- Créer un service systemd pour Gunicorn
- Configurer le démarrage automatique
- Tester Gunicorn

**Tâche 7.3.5 : Configuration SSL/HTTPS**
- Obtenir un certificat SSL (Let's Encrypt recommandé)
- Configurer le renouvellement automatique
- Configurer Nginx pour utiliser HTTPS
- Tester HTTPS

**Tâche 7.3.6 : Déploiement du code**
- Cloner le code sur le serveur
- Créer l'environnement virtuel
- Installer les dépendances
- Configurer les variables d'environnement
- Appliquer les migrations
- Collecter les fichiers statiques
- Redémarrer les services

**Tâche 7.3.7 : Configuration du monitoring**
- Configurer les logs :
  - Logs Django
  - Logs Nginx
  - Logs Gunicorn
- Configurer un health check endpoint
- Configurer des alertes (optionnel)

**Tâche 7.3.8 : Configuration des backups**
- Configurer les backups de la base de données :
  - Script de backup quotidien
  - Rétention des backups
  - Stockage des backups
- Configurer les backups des fichiers médias
- Tester la restauration depuis un backup

**Tâche 7.3.9 : Tests post-déploiement**
- Vérifier que tous les endpoints fonctionnent
- Vérifier les performances
- Vérifier la sécurité (HTTPS, headers)
- Vérifier les logs
- Vérifier les backups

**Livrables :**
- Application déployée en production
- Serveur web configuré
- SSL/HTTPS actif
- Monitoring en place
- Backups configurés
- Tests post-déploiement réussis

---

### CHECKLIST FINALE P