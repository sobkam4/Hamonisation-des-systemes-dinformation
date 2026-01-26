
# settings 
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',  # moteur PostgreSQL
        'NAME': 'nom_de_ta_base',                   # nom de la base
        'USER': 'ton_utilisateur',                  # utilisateur PostgreSQL
        'PASSWORD': 'ton_mot_de_passe',             # mot de passe
        'HOST': 'localhost',                        # ou l'adresse du serveur
        'PORT': '5432',                             # port par défaut de PostgreSQL
    }
}

# 3. Créer la base de données
psql -U ton_utilisateur -h localhost -c "CREATE DATABASE nom_de_ta_base;"


# appliqué les migrations 
python manage.py migrate


### =====================================
5. (Optionnel) Utiliser un fichier .env
Pour éviter de mettre tes identifiants en dur dans settings.py, tu peux utiliser un fichier .env :

DB_NAME=nom_de_ta_base
DB_USER=ton_utilisateur
DB_PASSWORD=ton_mot_de_passe
DB_HOST=localhost
DB_PORT=5432


Puis dans settings.py avec django-environ :

import environ

env = environ.Env()
environ.Env.read_env()

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env("DB_NAME"),
        'USER': env("DB_USER"),
        'PASSWORD': env("DB_PASSWORD"),
        'HOST': env("DB_HOST"),
        'PORT': env("DB_PORT"),
    }
}


### ===================== Lien avec docker-compose.yml

Deux façons **propres et standards** 👍

---

## 1️⃣ Utiliser un fichier `.env` (le plus courant)

### `.env`

```env
DB_NAME=mydb
DB_USER=admin
DB_PASSWORD=secret
```

### `docker-compose.yml`

```yaml
services:
  app:
    image: myapp
    env_file:
      - .env
```

➡️ Toutes les variables sont injectées dans le conteneur.

---

## 2️⃣ Utiliser les variables du `.env` dans le `docker-compose.yml`

### `.env`

```env
DB_NAME=mydb
```

### `docker-compose.yml`

```yaml
services:
  db:
    image: postgres
    environment:
      POSTGRES_DB: ${DB_NAME}
```

➡️ Docker Compose lit automatiquement `.env` (au même niveau).

---

## ⚠️ Bonnes pratiques

* Ne **commit jamais** `.env` (ajoute-le à `.gitignore`)
* Utilise `.env.example` pour documenter
* Pour la prod → variables d’environnement système ou secrets Docker



⚠️ Point CLÉ (souvent source de bugs)
  Django dans Docker → DB_HOST=db
  Django hors Docker → DB_HOST=localhost
👉 Si tout est dockerisé, ne change jamais.

---

Si tu veux, je peux te montrer :

* un exemple **Django / FastAPI / Flask**
* ou **Postgres + Redis + backend** 🧠




### =========================================

Voici un **exemple concret et minimal** avec **PostgreSQL + Python (Django/FastAPI)**.

---

## 📄 `.env`

```env
DB_NAME=narpt_db
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=localhost
DB_PORT=5432
```

---

## 🐳 `docker-compose.yml` (PostgreSQL)

```yaml
version: "3.9"

services:
  db:
    image: postgres:16
    container_name: narpt_postgres
    env_file:
      - .env
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 🐍 Python (connexion PostgreSQL)

### Exemple simple avec `psycopg2`

```python
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
)

print("Connexion OK 🚀")
```

---

## ⚠️ Important

Si **Python tourne dans Docker**, alors :

```env
DB_HOST=db
```

(et **pas** `localhost`)

---

## ✅ Bonnes pratiques

* `.env` → jamais dans git
* `.env.example` → sans mots de passe
* Docker = **nom du service** comme host

---

Si tu veux :

* version **Django (`settings.py`)**
* version **FastAPI + SQLAlchemy**
* version **sans Docker**


🔧 Dev
docker compose --env-file .env up --build
👉 Utilise .env (DB_HOST=localhost)

🚀 Prod
docker compose --env-file .env.prod up -d --build
👉 Utilise .env.prod (DB_HOST=db)