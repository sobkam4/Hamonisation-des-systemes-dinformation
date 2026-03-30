# Guide Docker Compose

Ce projet utilise plusieurs fichiers `docker-compose` pour différents environnements.

## Fichiers disponibles

### 1. `docker-compose.yml` (Configuration complète par défaut)
**Usage:** `docker-compose up`

Configuration complète avec tous les services :
- ✅ PostgreSQL
- ✅ Redis
- ✅ MinIO (stockage S3)
- ✅ Backend Django (Gunicorn)
- ✅ Frontend Next.js (Production)
- ✅ Celery Worker
- ✅ Celery Beat
- ✅ Nginx (Reverse Proxy)

**Idéal pour:** Tests complets, démonstrations, environnements de staging

---

### 2. `docker-compose.dev.yml` (Développement)
**Usage:** `docker-compose -f docker-compose.dev.yml up`

Configuration optimisée pour le développement :
- ✅ PostgreSQL
- ✅ Redis
- ✅ Backend Django (`runserver` avec hot-reload)
- ✅ Frontend Next.js (Mode développement avec hot-reload)
- ✅ Celery Worker (optionnel)
- ❌ Pas de MinIO (stockage local)
- ❌ Pas de Nginx

**Idéal pour:** Développement quotidien avec rechargement automatique

**Volumes:** Les volumes sont montés pour permettre le hot-reload du code

---

### 3. `docker-compose.prod.yml` (Production)
**Usage:** `docker-compose -f docker-compose.prod.yml up`

Configuration optimisée pour la production :
- ✅ PostgreSQL (avec variables d'environnement)
- ✅ Redis
- ✅ MinIO (ou S3 réel via variables d'environnement)
- ✅ Backend Django (Gunicorn avec workers configurables)
- ✅ Frontend Next.js (Production)
- ✅ Celery Worker (avec concurrency configurable)
- ✅ Celery Beat
- ✅ Nginx (avec SSL/HTTPS)

**Idéal pour:** Déploiement en production

**⚠️ IMPORTANT:** Créez un fichier `.env` avec toutes les variables nécessaires :
```env
# Base de données
POSTGRES_DB=location_erp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=votre_mot_de_passe_securise

# Django
SECRET_KEY=votre_secret_key_tres_longue_et_securisee
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com
CORS_ALLOWED_ORIGINS=https://votre-domaine.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com/api

# MinIO (optionnel)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=mot_de_passe_securise

# S3 (si vous utilisez S3 réel au lieu de MinIO)
USE_S3=true
AWS_ACCESS_KEY_ID=votre_access_key
AWS_SECRET_ACCESS_KEY=votre_secret_key
AWS_STORAGE_BUCKET_NAME=location-erp
AWS_S3_ENDPOINT_URL=https://s3.amazonaws.com
AWS_S3_REGION_NAME=us-east-1

# Performance (optionnel)
GUNICORN_WORKERS=3
CELERY_WORKERS=4
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

---

## Commandes utiles

### Démarrer les services
```bash
# Configuration complète (par défaut)
docker-compose up

# Développement
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

### Démarrer en arrière-plan
```bash
docker-compose up -d
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.prod.yml up -d
```

### Arrêter les services
```bash
docker-compose down
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.prod.yml down
```

### Voir les logs
```bash
docker-compose logs -f
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Reconstruire les images
```bash
docker-compose build --no-cache
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Nettoyer les volumes (⚠️ supprime les données)
```bash
docker-compose down -v
```

---

## Recommandations

### Pour le développement quotidien
Utilisez `docker-compose.dev.yml` pour bénéficier du hot-reload et d'une configuration plus simple.

### Pour tester avant la production
Utilisez `docker-compose.yml` pour tester avec tous les services comme en production.

### Pour la production
Utilisez `docker-compose.prod.yml` avec un fichier `.env` sécurisé et des variables d'environnement appropriées.

---

## Dépannage

### Les services ne démarrent pas
1. Vérifiez que les ports ne sont pas déjà utilisés
2. Vérifiez les logs : `docker-compose logs`
3. Vérifiez que Docker a assez de ressources (mémoire, CPU)

### Erreurs de connexion à la base de données
1. Attendez que PostgreSQL soit complètement démarré (healthcheck)
2. Vérifiez les variables d'environnement
3. Vérifiez les logs : `docker-compose logs db`

### Le frontend ne se connecte pas au backend
1. Vérifiez `NEXT_PUBLIC_API_URL` dans les variables d'environnement
2. Vérifiez que le backend est démarré : `docker-compose ps`
3. Vérifiez CORS dans les paramètres Django
