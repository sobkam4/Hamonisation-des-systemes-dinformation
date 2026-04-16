# VITA — Backend API

Django 5 + Django REST Framework + PostgreSQL + Redis + Celery + MinIO.

## Démarrage (Docker)

```bash
cd backend
# Générer une clé Fernet pour le chiffrement santé (recommandé)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Copier dans .env : VITA_FIELD_ENCRYPTION_KEY=...

docker compose up --build
```

- API : http://localhost:8000/api/v1/
- Docs OpenAPI : http://localhost:8000/api/v1/docs/
- Admin : http://localhost:8000/admin/
- MinIO : http://localhost:9001

Créer un superuser (téléphone = identifiant) :

```bash
docker compose exec api python manage.py createsuperuser
docker compose exec api python manage.py seed_demo
```

## Démarrage local (sans Docker)

PostgreSQL + Redis + MinIO requis. Copier `.env.example` vers `.env`, puis :

```bash
pip install -r requirements.txt
set DJANGO_SETTINGS_MODULE=config.settings.dev
python manage.py migrate
python manage.py runserver
```

## Endpoints principaux

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/v1/health/` | Santé |
| POST | `/api/v1/auth/request-otp/` | Demande OTP SMS (Twilio) |
| POST | `/api/v1/auth/verify-otp/` | JWT access + refresh |
| GET/PATCH | `/api/v1/users/me/` | Profil |
| CRUD | `/api/v1/users/ice-contacts/` | Contacts ICE |
| POST | `/api/v1/rescuer/apply/` | Candidature secouriste + URL upload preuve (MinIO) |
| GET | `/api/v1/passport/` | Passeport vital (chiffré) |
| POST | `/api/v1/qr/generate/` | Token QR |
| POST | `/api/v1/qr/scan/` | Scan (secouriste vérifié uniquement) |
| GET | `/api/v1/content/protocols/` | Protocoles |
| GET | `/api/v1/content/bundles/latest/` | Bundle offline |
| ... | `/api/v1/training/`, `/api/v1/enterprise/`, `/api/v1/emergency/sos/` | Formation, SST, SOS |

## Tests

```bash
set DJANGO_SETTINGS_MODULE=config.settings.test
pytest
```

## CI

Workflow GitHub Actions : lint (ruff) + pytest.
