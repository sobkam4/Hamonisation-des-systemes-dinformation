# Guide de Déploiement - ERP Location Immobilière

## 🚀 Déploiement en Production

### Prérequis
- Ubuntu 20.04+ ou CentOS 8+
- Docker & Docker Compose
- Nginx
- Domaine configuré avec SSL
- PostgreSQL 15+
- Redis 7+

### 1. Configuration du Serveur

#### Mise à jour du système
```bash
sudo apt update && sudo apt upgrade -y
```

#### Installation de Docker
```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Installation de Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Configuration du Projet

#### Cloner le projet
```bash
cd /var/www
sudo git clone <repository-url> location-erp
sudo chown -R $USER:$USER /var/www/location-erp
cd location-erp/backend
```

#### Configuration des variables d'environnement
```bash
# Créer le fichier .env
nano .env
```

**Contenu du fichier .env:**
```bash
# Configuration Django
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DJANGO_SETTINGS_MODULE=location_erp.settings

# Base de données
POSTGRES_DB=location_erp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
DATABASE_URL=postgresql://postgres:your-secure-password@db:5432/location_erp

# Redis
REDIS_URL=redis://redis:6379/0

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### 3. Configuration Nginx

#### Créer le fichier de configuration
```bash
sudo nano /etc/nginx/sites-available/location-erp
```

**Contenu du fichier Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # Configuration SSL
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # En-têtes de sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Taille maximale pour les uploads
    client_max_body_size 10M;
    
    # Fichiers statiques
    location /static/ {
        alias /var/www/location-erp/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Fichiers médias
    location /media/ {
        alias /var/www/location-erp/backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # API Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Admin Django
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### Activer le site
```bash
sudo ln -s /etc/nginx/sites-available/location-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configuration SSL avec Let's Encrypt

#### Installation de Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### Obtenir le certificat SSL
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Configuration du renouvellement automatique
```bash
sudo crontab -e
# Ajouter cette ligne
0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Déploiement avec Docker

#### Lancer les services
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Vérifier les services
```bash
# Vérifier les conteneurs
docker-compose -f docker-compose.prod.yml ps

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f web

# Vérifier la santé des services
docker-compose -f docker-compose.prod.yml exec web python manage.py check
```

#### Créer le superutilisateur
```bash
docker-compose -f docker-compose.prod.yml exec web python manage.py createsuperuser
```

#### Appliquer les migrations
```bash
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate
```

### 6. Configuration des Tâches Planifiées

#### Créer les répertoires de logs
```bash
sudo mkdir -p /var/log/location-erp
sudo chown $USER:$USER /var/log/location-erp
```

#### Configurer Celery Beat pour les tâches automatiques
```bash
# Ajouter au docker-compose.prod.yml
celery-beat:
  build: .
  command: celery -A location_erp beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
  environment:
    - DEBUG=0
    - SECRET_KEY=${SECRET_KEY}
    - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    - REDIS_URL=redis://redis:6379/0
  depends_on:
    - db
    - redis
  volumes:
    - .:/app
    - /var/log/location-erp:/app/logs
  restart: unless-stopped
```

### 7. Monitoring et Logs

#### Configuration des logs
```bash
# Créer le fichier de configuration des logs
sudo nano /etc/logrotate.d/location-erp
```

**Contenu du fichier logrotate:**
```
/var/log/location-erp/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker-compose -f /var/www/location-erp/backend/docker-compose.prod.yml restart web
    endscript
}
```

#### Monitoring avec UFW (Firewall)
```bash
# Activer le firewall
sudo ufw enable

# Autoriser les ports nécessaires
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Vérifier le statut
sudo ufw status
```

### 8. Backup Automatique

#### Script de backup
```bash
sudo nano /usr/local/bin/backup-location-erp.sh
```

**Contenu du script:**
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/location-erp"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="location_erp"
DB_USER="postgres"

# Créer le répertoire de backup
mkdir -p $BACKUP_DIR

# Backup de la base de données
docker-compose -f /var/www/location-erp/backend/docker-compose.prod.yml exec -T db pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup des fichiers médias
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz /var/www/location-erp/backend/media/

# Supprimer les vieux backups (garder 30 jours)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup terminé: $DATE"
```

#### Rendre le script exécutable
```bash
sudo chmod +x /usr/local/bin/backup-location-erp.sh
```

#### Configurer la tâche cron
```bash
sudo crontab -e
# Ajouter cette ligne pour un backup quotidien à 2h du matin
0 2 * * * /usr/local/bin/backup-location-erp.sh >> /var/log/location-erp/backup.log 2>&1
```

### 9. Mise à Jour du Déploiement

#### Script de mise à jour
```bash
#!/bin/bash

cd /var/www/location-erp/backend

# Sauvegarder avant la mise à jour
/usr/local/bin/backup-location-erp.sh

# Mettre à jour le code
git pull origin main

# Reconstruire et redémarrer les conteneurs
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Appliquer les migrations
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate

# Collecter les fichiers statiques
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput

echo "Mise à jour terminée"
```

### 10. Sécurité Supplémentaire

#### Configuration Fail2Ban
```bash
sudo apt install fail2ban -y

# Créer la configuration
sudo nano /etc/fail2ban/jail.local
```

**Contenu jail.local:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

#### Démarrer Fail2Ban
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 11. Vérification Post-Déploiement

#### Checklist de vérification
- [ ] Le site est accessible en HTTPS
- [ ] L'admin Django fonctionne
- [ ] Les API répondent correctement
- [ ] Les uploads de fichiers fonctionnent
- [ ] Les emails sont envoyés
- [ ] Les tâches Celery s'exécutent
- [ ] Les backups sont créés
- [ ] Les logs sont générés
- [ ] Le monitoring est actif

#### Tests de charge (optionnel)
```bash
# Installer Apache Bench
sudo apt install apache2-utils -y

# Test de charge sur l'API
ab -n 1000 -c 10 https://yourdomain.com/api/biens/
```

### 12. Dépannage

#### Problèmes courants

**Service ne démarre pas:**
```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs web

# Vérifier la configuration
docker-compose -f docker-compose.prod.yml exec web python manage.py check
```

**Problèmes de base de données:**
```bash
# Vérifier la connexion
docker-compose -f docker-compose.prod.yml exec web python manage.py dbshell

# Réinitialiser les migrations
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate --fake-initial
```

**Problèmes de permissions:**
```bash
# Corriger les permissions
sudo chown -R www-data:www-data /var/www/location-erp/backend/media
sudo chmod -R 755 /var/www/location-erp/backend/media
```

---

## 📞 Support

Pour toute question sur le déploiement:
- Email: support@location-erp.com
- Documentation: https://docs.location-erp.com
- Issues: https://github.com/your-repo/issues
