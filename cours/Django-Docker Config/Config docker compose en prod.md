Très court et clair 👌

---

## 🌐 NGINX

**NGINX = serveur web / reverse proxy**

### À quoi ça sert ?

* Reçoit les requêtes HTTP/HTTPS
* Sert les fichiers statiques (CSS, JS, images)
* Redirige les requêtes vers Django
* Gère SSL (HTTPS)
* Très rapide et stable

👉 Django **ne doit pas** être exposé directement en prod.

---

## 🐍 GUNICORN

**Gunicorn = serveur WSGI pour Python**

### À quoi ça sert ?

* Exécute ton code Django en production
* Remplace `runserver`
* Gère plusieurs workers (processus)
* Plus performant et sécurisé

👉 `runserver` = **DEV uniquement**.

---

## 🔁 Comment ils travaillent ensemble

```
Client (navigateur)
        ↓
      NGINX
        ↓
     GUNICORN
        ↓
      Django
```

---

## ❌ Mauvaise pratique

```bash
python manage.py runserver 0.0.0.0:8000
```

👉 OK en dev
👉 ❌ interdit en prod

---

## ✅ Bonne pratique (prod)

```bash
gunicorn config.wsgi:application
```

derrière **NGINX**

---

## 🧠 Analogie simple

* **NGINX** = le vigile à l’entrée
* **Gunicorn** = le moteur
* **Django** = le cerveau

---

## 🎯 Résumé

| Outil     | Rôle           | Dev | Prod |
| --------- | -------------- | --- | ---- |
| runserver | serveur Django | ✅   | ❌    |
| Gunicorn  | serveur Python | ❌   | ✅    |
| Nginx     | serveur web    | ❌   | ✅    |

Si tu veux, je peux te montrer un **docker-compose prod avec Nginx + Gunicorn**, prêt à déployer.



Structure des fichiers

ARPT_APP_WEB/
├── docker-compose.yml          # Développement
├── docker-compose.prod.yml     # Production ⭐
├── nginx/
│   ├── nginx.conf              # Config principale Nginx
│   ├── conf.d/
│   │   └── django.conf         # Config Django
│   └── ssl/                    # Certificats SSL (à ajouter)
├── backend/
│   ├── Dockerfile              # Dev
│   ├── Dockerfile.prod        # Production ⭐
│   └── gunicorn_config.py     # Config Gunicorn ⭐
└── README.DOCKER.md            # Documentation ⭐