Roadmap pour créer des conteneurs Docker sans volumes pour le backend Django ARPT Guinea :

```markdown
# ROADMAP DOCKER - BACKEND DJANGO ARPT GUINÉE
## Création des conteneurs Docker sans volumes persistants

---

## 📋 PRÉREQUIS

### Outils nécessaires
- Docker installé (version 20.10+)
- Docker Compose installé (version 2.0+)
- Git (pour le contrôle de version)

### Vérifications
- Vérifier Docker : `docker --version`
- Vérifier Docker Compose : `docker compose version`
- Vérifier que Docker est en cours d'exécution

---

## 🗓️ TIMELINE

**Durée estimée** : 2-3 jours

| Phase | Durée | Description |
|-------|-------|-------------|
| Phase 1 : Préparation | 2-3 heures | Structure et fichiers de base |
| Phase 2 : Dockerfile Django | 3-4 heures | Containerisation de l'application |
| Phase 3 : Docker Compose | 2-3 heures | Orchestration des services |
| Phase 4 : Configuration | 2-3 heures | Variables d'environnement et optimisations |
| Phase 5 : Tests et validation | 2-3 heures | Tests des conteneurs |

---

## 📦 PHASE 1 : PRÉPARATION
**Durée** : 2-3 heures  
**Objectif** : Préparer la structure et les fichiers de base

---

### JOUR 1 : STRUCTURE ET FICHIERS DE BASE

#### Tâche 1.1 : Analyse de la structure actuelle

**Actions :**
- Lister tous les fichiers du projet Django
- Identifier les fichiers à exclure de Docker (.env, venv/, etc.)
- Identifier les dépendances (requirements.txt)
- Vérifier la structure des dossiers

**Fichiers à vérifier :**
- `requirements.txt` (doit être à jour)
- `manage.py`
- Structure des apps Django
- Fichiers de configuration

#### Tâche 1.2 : Création du fichier .dockerignore

**Objectif :** Exclure les fichiers inutiles du contexte Docker

**Créer le fichier `.dockerignore` à la racine du projet :**

**Contenu à inclure :**
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
.venv

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Fichiers d'environnement
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*.sublime-project
*.sublime-workspace

# OS
.DS_Store
Thumbs.db
*.swp

# Git
.git/
.gitignore
.gitattributes

# Docker
Dockerfile
docker-compose.yml
.dockerignore

# Documentation
README.md
*.md
docs/

# Tests
.pytest_cache/
.coverage
htmlcov/

# Médias et statiques (seront générés dans le conteneur)
media/
staticfiles/
static/

# Autres
*.bak
*.tmp
```

**Points d'attention :**
- Ne pas exclure les fichiers nécessaires au fonctionnement
- Vérifier que requirements.txt n'est pas exclu
- Vérifier que manage.py n'est pas exclu

**Livrables :**
- Fichier `.dockerignore` créé et configuré

---

### Tâche 1.3 : Vérification de requirements.txt

**Actions :**
- Vérifier que requirements.txt contient toutes les dépendances
- S'assurer que les versions sont spécifiées
- Vérifier qu'il n'y a pas de dépendances système manquantes

**Contenu typique de requirements.txt :**
```
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
psycopg2-binary==2.9.9
python-decouple==3.8
Pillow==10.1.0
djangorestframework-simplejwt==5.3.0
gunicorn==21.2.0
```

**Points d'attention :**
- Utiliser `psycopg2-binary` (pas `psycopg2`) pour éviter les dépendances système
- Inclure `gunicorn` pour la production
- Vérifier la compatibilité des versions

**Livrables :**
- `requirements.txt` vérifié et à jour

---

## 🐳 PHASE 2 : DOCKERFILE DJANGO
**Durée** : 3-4 heures  
**Objectif** : Créer le Dockerfile pour l'application Django

---

### JOUR 1-2 : CRÉATION DU DOCKERFILE

#### Tâche 2.1 : Création du Dockerfile de base

**Créer le fichier `Dockerfile` à la racine du projet**

**Structure recommandée (multi-stage build) :**

**Étape 1 : Image de base**
- Choisir l'image Python officielle
- Version : Python 3.11-slim (léger et sécurisé)
- Définir le répertoire de travail

**Étape 2 : Dépendances système**
- Installer les dépendances système nécessaires
- Nettoyer le cache apt

**Étape 3 : Dépendances Python**
- Copier requirements.txt
- Installer les dépendances Python
- Nettoyer le cache pip

**Étape 4 : Code de l'application**
- Copier le code de l'application
- Définir les permissions

**Étape 5 : Configuration**
- Exposer le port
- Définir la commande par défaut

**Contenu du Dockerfile :**

```dockerfile
# Étape 1 : Image de base
FROM python:3.11-slim as base

# Définir les variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Définir le répertoire de travail
WORKDIR /app

# Étape 2 : Dépendances système
FROM base as system-deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Étape 3 : Dépendances Python
FROM system-deps as python-deps
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Étape 4 : Application
FROM python-deps as app
COPY . .

# Créer les dossiers pour médias et statiques
RUN mkdir -p /app/media /app/staticfiles

# Définir les permissions
RUN chmod +x /app/manage.py

# Exposer le port
EXPOSE 8000

# Commande par défaut (sera surchargée par docker-compose)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "arpt_backend.wsgi:application"]
```

**Décisions à prendre :**
- Version de Python (3.11 recommandé)
- Nombre de workers Gunicorn (4 par défaut)
- Image de base (slim pour réduire la taille)

**Points d'attention :**
- Utiliser multi-stage build pour réduire la taille
- Nettoyer les caches pour réduire la taille
- Définir PYTHONDONTWRITEBYTECODE et PYTHONUNBUFFERED
- Exposer le port 8000

**Livrables :**
- Dockerfile créé et configuré

---

#### Tâche 2.2 : Optimisation du Dockerfile

**Actions :**
- Vérifier l'ordre des instructions (mettre les moins changeantes en premier)
- Optimiser les layers Docker
- Réduire la taille de l'image finale

**Améliorations possibles :**
- Séparer l'installation des dépendances système et Python
- Utiliser des versions spécifiques pour la reproductibilité
- Ajouter des labels pour la documentation

**Version optimisée :**

```dockerfile
# Labels pour documentation
LABEL maintainer="ARPT Guinea" \
      version="1.0" \
      description="ARPT Guinea Backend API"

# ... (reste du Dockerfile)
```

**Livrables :**
- Dockerfile optimisé

---

#### Tâche 2.3 : Test de build du Dockerfile

**Actions :**
- Tester le build : `docker build -t arpt-backend .`
- Vérifier qu'il n'y a pas d'erreurs
- Vérifier la taille de l'image : `docker images arpt-backend`
- Tester le démarrage : `docker run -p 8000:8000 arpt-backend`

**Commandes de test :**
```bash
# Build de l'image
docker build -t arpt-backend .

# Vérifier la taille
docker images arpt-backend

# Tester le conteneur (sans base de données pour l'instant)
docker run -p 8000:8000 arpt-backend
```

**Points d'attention :**
- Le conteneur ne démarrera pas sans la base de données
- Vérifier les erreurs dans les logs
- Vérifier que tous les fichiers sont copiés

**Livrables :**
- Image Docker buildée avec succès
- Tests de build réussis

---

## 🐙 PHASE 3 : DOCKER COMPOSE
**Durée** : 2-3 heures  
**Objectif** : Créer docker-compose.yml pour orchestrer les services

---

### JOUR 2-3 : CONFIGURATION DOCKER COMPOSE

#### Tâche 3.1 : Création de docker-compose.yml

**Créer le fichier `docker-compose.yml` à la racine du projet**

**Services à créer :**
1. **db** : PostgreSQL
2. **web** : Application Django
3. **nginx** (optionnel) : Serveur web reverse proxy

**Structure de base :**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: arpt_db
    environment:
      POSTGRES_DB: arpt_db
      POSTGRES_USER: arpt_user
      POSTGRES_PASSWORD: arpt_password
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U arpt_user -d arpt_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    # Pas de volumes (données non persistantes)

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: arpt_backend
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn --bind 0.0.0.0:8000 --workers 4 arpt_backend.wsgi:application"
    environment:
      - DEBUG=False
      - DB_NAME=arpt_db
      - DB_USER=arpt_user
      - DB_PASSWORD=arpt_password
      - DB_HOST=db
      - DB_PORT=5432
      - SECRET_KEY=your-secret-key-here
      - ALLOWED_HOSTS=localhost,127.0.0.1
      - CORS_ALLOWED_ORIGINS=http://localhost:3000
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    # Pas de volumes (code et médias dans l'image)
```

**Décisions à prendre :**
- Version de PostgreSQL (15-alpine recommandé pour la légèreté)
- Ports à exposer
- Variables d'environnement à définir
- Nombre de workers Gunicorn

**Points d'attention :**
- Utiliser healthcheck pour PostgreSQL
- Définir depends_on avec condition
- Configurer les variables d'environnement
- Pas de volumes (comme demandé)

**Livrables :**
- docker-compose.yml créé avec services db et web

---

#### Tâche 3.2 : Configuration des variables d'environnement

**Option 1 : Variables dans docker-compose.yml (développement)**

**Avantages :**
- Simple pour le développement
- Facile à modifier

**Inconvénients :**
- Pas sécurisé pour la production
- Variables en clair dans le fichier

**Option 2 : Fichier .env (recommandé)**

**Créer le fichier `.env` (ne pas commiter) :**

```env
# Django
DEBUG=False
SECRET_KEY=your-super-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=arpt_db
DB_USER=arpt_user
DB_PASSWORD=arpt_password
DB_HOST=db
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Email (si nécessaire)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password
```

**Modifier docker-compose.yml pour utiliser .env :**

```yaml
services:
  web:
    # ...
    env_file:
      - .env
    environment:
      - DB_HOST=db
```

**Créer `.env.example` (template à commiter) :**

```env
# Django
DEBUG=False
SECRET_KEY=change-this-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=arpt_db
DB_USER=arpt_user
DB_PASSWORD=change-this-password
DB_HOST=db
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Points d'attention :**
- Ne jamais commiter le fichier .env
- Utiliser .env.example comme template
- Changer tous les secrets en production

**Livrables :**
- Fichier .env créé (local, non commité)
- Fichier .env.example créé (template, commité)
- docker-compose.yml mis à jour pour utiliser .env

---

#### Tâche 3.3 : Configuration avancée docker-compose.yml

**Améliorations à ajouter :**

**1. Réseau personnalisé :**
```yaml
networks:
  arpt_network:
    driver: bridge
```

**2. Restart policies :**
```yaml
services:
  db:
    restart: unless-stopped
  web:
    restart: unless-stopped
```

**3. Healthcheck pour web :**
```yaml
services:
  web:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**4. Logging :**
```yaml
services:
  web:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Version complète optimisée :**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: arpt_db
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "${DB_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - arpt_network

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: arpt_backend
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 120 arpt_backend.wsgi:application"
    env_file:
      - .env
    environment:
      - DB_HOST=db
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "manage.py", "check"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - arpt_network

networks:
  arpt_network:
    driver: bridge
```

**Livrables :**
- docker-compose.yml optimisé et complet
- Configuration réseau
- Healthchecks configurés
- Logging configuré

---

#### Tâche 3.4 : Création d'un endpoint health check

**Créer une vue simple pour le health check :**

**Créer `arpt_backend/views.py` (si n'existe pas) :**

```python
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    try:
        # Vérifier la connexion à la base de données
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"status": "healthy", "database": "connected"})
    except Exception as e:
        return JsonResponse({"status": "unhealthy", "error": str(e)}, status=503)
```

**Ajouter l'URL dans `arpt_backend/urls.py` :**

```python
from . import views

urlpatterns = [
    # ... autres URLs
    path('api/health/', views.health_check, name='health-check'),
]
```

**Points d'attention :**
- Endpoint simple et rapide
- Vérifie la connexion à la base de données
- Retourne un code de statut approprié

**Livrables :**
- Endpoint health check créé
- URL configurée

---

## ⚙️ PHASE 4 : CONFIGURATION
**Durée** : 2-3 heures  
**Objectif** : Finaliser la configuration et les optimisations

---

### JOUR 3 : CONFIGURATION FINALE

#### Tâche 4.1 : Adaptation de settings.py pour Docker

**Modifier `arpt_backend/settings.py` :**

**1. Configuration de la base de données :**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='arpt_db'),
        'USER': config('DB_USER', default='arpt_user'),
        'PASSWORD': config('DB_PASSWORD', default='arpt_password'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 600,  # Pour les connexions persistantes
    }
}
```

**2. Configuration des fichiers statiques et médias :**
```python
# En production Docker, les fichiers statiques sont collectés
STATIC_ROOT = '/app/staticfiles'
MEDIA_ROOT = '/app/media'

# URLs
STATIC_URL = '/static/'
MEDIA_URL = '/media/'
```

**3. Configuration ALLOWED_HOSTS :**
```python
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')
```

**4. Configuration CORS :**
```python
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000'
).split(',')
```

**Points d'attention :**
- Utiliser les variables d'environnement
- Configurer les chemins absolus pour Docker
- Gérer les connexions à la base de données

**Livrables :**
- settings.py adapté pour Docker

---

#### Tâche 4.2 : Scripts d'initialisation (optionnel)

**Créer un script d'initialisation pour les données de base :**

**Créer `scripts/init.sh` :**

```bash
#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Creating superuser if not exists..."
python manage.py shell << EOF
from accounts.models import User
if not User.objects.filter(email='admin@arpt.gov.gn').exists():
    User.objects.create_superuser(
        email='admin@arpt.gov.gn',
        username='admin',
        password='admin123',
        role='admin'
    )
    print("Superuser created")
else:
    print("Superuser already exists")
EOF

echo "Initialization complete!"
```

**Rendre exécutable :**
```bash
chmod +x scripts/init.sh
```

**Modifier docker-compose.yml pour utiliser le script :**

```yaml
services:
  web:
    command: >
      sh -c "./scripts/init.sh &&
             gunicorn --bind 0.0.0.0:8000 --workers 4 arpt_backend.wsgi:application"
```

**Points d'attention :**
- Script doit être exécutable
- Gérer les erreurs avec set -e
- Vérifier l'existence avant de créer

**Livrables :**
- Script d'initialisation créé (optionnel)

---

#### Tâche 4.3 : Optimisation de Gunicorn

**Créer un fichier de configuration Gunicorn :**

**Créer `gunicorn_config.py` :**

```python
# Gunicorn configuration file
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 50
preload_app = True
accesslog = "-"
errorlog = "-"
loglevel = "info"
```

**Modifier docker-compose.yml :**

```yaml
services:
  web:
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn -c gunicorn_config.py arpt_backend.wsgi:application"
```

**Points d'attention :**
- Ajuster le nombre de workers selon les ressources
- Configurer les timeouts appropriés
- Logs vers stdout pour Docker

**Livrables :**
- Fichier gunicorn_config.py créé
- Configuration optimisée

---

#### Tâche 4.4 : Mise à jour de .gitignore

**Ajouter les fichiers Docker dans .gitignore :**

```
# Docker
.env
.env.local
*.log
```

**Points d'attention :**
- Ne pas ignorer .env.example
- Ne pas ignorer Dockerfile et docker-compose.yml

**Livrables :**
- .gitignore mis à jour

---

## 🧪 PHASE 5 : TESTS ET VALIDATION
**Durée** : 2-3 heures  
**Objectif** : Tester et valider les conteneurs Docker

---

### JOUR 3-4 : TESTS

#### Tâche 5.1 : Build et démarrage des conteneurs

**Commandes à exécuter :**

```bash
# 1. Build des images
docker compose build

# 2. Démarrer les conteneurs
docker compose up -d

# 3. Vérifier les conteneurs en cours d'exécution
docker compose ps

# 4. Voir les logs
docker compose logs -f

# 5. Voir les logs d'un service spécifique
docker compose logs -f web
docker compose logs -f db
```

**Vérifications :**
- Les conteneurs démarrent sans erreur
- Les logs ne montrent pas d'erreurs critiques
- La base de données est accessible
- L'application Django répond

**Livrables :**
- Conteneurs buildés avec succès
- Conteneurs démarrés et fonctionnels

---

#### Tâche 5.2 : Tests de connectivité

**Tests à effectuer :**

**1. Test de la base de données :**
```bash
# Se connecter au conteneur db
docker compose exec db psql -U arpt_user -d arpt_db -c "SELECT version();"
```

**2. Test de l'application :**
```bash
# Se connecter au conteneur web
docker compose exec web python manage.py check

# Tester les migrations
docker compose exec web python manage.py showmigrations

# Tester l'endpoint health
curl http://localhost:8000/api/health/
```

**3. Test des endpoints API :**
```bash
# Tester un endpoint public
curl http://localhost:8000/api/pages/

# Tester l'admin (si configuré)
curl http://localhost:8000/admin/
```

**Points d'attention :**
- Vérifier que tous les services communiquent
- Vérifier que les migrations sont appliquées
- Vérifier que les endpoints répondent

**Livrables :**
- Tests de connectivité réussis
- Application accessible

---

#### Tâche 5.3 : Tests de performance

**Tests à effectuer :**

**1. Vérifier l'utilisation des ressources :**
```bash
# Stats des conteneurs
docker stats

# Vérifier la taille des images
docker images
```

**2. Test de charge (optionnel) :**
```bash
# Installer Apache Bench
# Tester avec ab
ab -n 1000 -c 10 http://localhost:8000/api/health/
```

**Points d'attention :**
- Vérifier l'utilisation mémoire
- Vérifier l'utilisation CPU
- Vérifier la taille des images

**Livrables :**
- Performance vérifiée
- Ressources optimisées

---

#### Tâche 5.4 : Tests de redémarrage

**Tests à effectuer :**

**1. Redémarrage des conteneurs :**
```bash
# Arrêter les conteneurs
docker compose down

# Redémarrer
docker compose up -d

# Vérifier que tout fonctionne
docker compose ps
```

**2. Test de reconstruction :**
```bash
# Rebuild sans cache
docker compose build --no-cache

# Redémarrer
docker compose up -d
```

**Points d'attention :**
- Les conteneurs doivent redémarrer correctement
- Les données doivent être recréées (pas de volumes)
- Les migrations doivent être réappliquées

**Livrables :**
- Tests de redémarrage réussis

---

#### Tâche 5.5 : Documentation Docker

**Créer un fichier `DOCKER.md` avec :**

**Contenu :**
- Instructions de build
- Instructions de démarrage
- Commandes utiles
- Dépannage
- Architecture des conteneurs

**Exemple de contenu :**

```markdown
# Documentation Docker - ARPT Guinea Backend

## Prérequis
- Docker 20.10+
- Docker Compose 2.0+

## Build et démarrage

### Build des images
```bash
docker compose build
```

### Démarrer les conteneurs
```bash
docker compose up -d
```

### Voir les logs
```bash
docker compose logs -f
```

## Commandes utiles

### Accéder au shell du conteneur web
```bash
docker compose exec web bash
```

### Exécuter des commandes Django
```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

### Arrêter les conteneurs
```bash
docker compose down
```

## Architecture

- **db** : PostgreSQL 15 (port 5432)
- **web** : Django + Gunicorn (port 8000)

## Dépannage

### Les conteneurs ne démarrent pas
- Vérifier les logs : `docker compose logs`
- Vérifier les ports disponibles
- Vérifier les variables d'environnement

### Erreur de connexion à la base de données
- Vérifier que le conteneur db est démarré
- Vérifier les variables DB_* dans .env
- Vérifier le healthcheck de db
```

**Livrables :**
- Documentation Docker complète

---

## 📁 RÉCAPITULATIF DES FICHIERS

### Fichiers à créer/modifier

#### Fichiers Docker
1. **Dockerfile** (racine)
   - Configuration de l'image Django
   - Multi-stage build
   - Optimisations

2. **docker-compose.yml** (racine)
   - Configuration des services (db, web)
   - Réseaux
   - Healthchecks
   - Variables d'environnement

3. **.dockerignore** (racine)
   - Exclusion des fichiers inutiles
   - Réduction du contexte de build

#### Fichiers de configuration
4. **.env** (racine, non commité)
   - Variables d'environnement locales
   - Secrets

5. **.env.example** (racine, commité)
   - Template des variables d'environnement
   - Documentation

6. **gunicorn_config.py** (racine, optionnel)
   - Configuration Gunicorn
   - Optimisations

#### Fichiers Django modifiés
7. **arpt_backend/settings.py**
   - Adaptation pour Docker
   - Chemins absolus
   - Configuration base de données

8. **arpt_backend/urls.py**
   - Ajout endpoint health check

9. **arpt_backend/views.py** (créer si n'existe pas)
   - Vue health check

#### Fichiers de documentation
10. **DOCKER.md** (racine)
    - Documentation Docker
    - Instructions
    - Dépannage

#### Fichiers optionnels
11. **scripts/init.sh** (optionnel)
    - Script d'initialisation
    - Création superuser

---

## 🎯 CHECKLIST FINALE

### Fichiers créés
- [ ] Dockerfile créé et optimisé
- [ ] docker-compose.yml créé et configuré
- [ ] .dockerignore créé
- [ ] .env créé (local)
- [ ] .env.example créé (template)
- [ ] gunicorn_config.py créé (optionnel)
- [ ] DOCKER.md créé

### Configuration
- [ ] settings.py adapté pour Docker
- [ ] Endpoint health check créé
- [ ] Variables d'environnement configurées
- [ ] .gitignore mis à jour

### Tests
- [ ] Build des images réussi
- [ ] Conteneurs démarrent sans erreur
- [ ] Base de données accessible
- [ ] Application Django accessible
- [ ] Endpoints API fonctionnels
- [ ] Health check fonctionnel
- [ ] Tests de redémarrage réussis

### Documentation
- [ ] DOCKER.md complet
- [ ] README.md mis à jour avec instructions Docker
- [ ] Commentaires dans les fichiers de configuration

---

## 📊 COMMANDES DOCKER UTILES

### Gestion des conteneurs
```bash
# Build
docker compose build
docker compose build --no-cache

# Démarrage
docker compose up -d
docker compose up (avec logs)

# Arrêt
docker compose down
docker compose stop

# Redémarrage
docker compose restart

# Voir les conteneurs
docker compose ps

# Logs
docker compose logs -f
docker compose logs -f web
docker compose logs -f db
```

### Commandes dans les conteneurs
```bash
# Shell dans web
docker compose exec web bash

# Shell dans db
docker compose exec db sh

# Commandes Django
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py collectstatic
```

### Nettoyage
```bash
# Arrêter et supprimer les conteneurs
docker compose down

# Supprimer aussi les volumes (si existants)
docker compose down -v

# Nettoyer les images non utilisées
docker system prune -a
```

### Debugging
```bash
# Voir les logs en temps réel
docker compose logs -f

# Inspecter un conteneur
docker inspect arpt_backend

# Voir les stats
docker stats

# Voir les processus
docker compose top
```

---

**Durée totale estimée** : 2-3 jours  
**Version** : 1.0  
**Date** : [Date actuelle]
```

Cette roadmap couvre la création des conteneurs Docker sans volumes. Chaque phase détaille les fichiers à créer/modifier et les étapes à suivre.

Souhaitez-vous que je détaille une phase spécifique ou que j’ajoute des configurations particulières (Nginx, Redis, etc.) ?