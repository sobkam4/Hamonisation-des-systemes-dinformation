# Arrêter tous les conteneurs
docker-compose -f docker-compose.dev.yml down

# Nettoyer le cache de build Docker
docker builder prune -f

# Supprimer les images orphelines
docker image prune -f

# Reconstruire sans cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Démarrer les conteneurs
docker-compose -f docker-compose.dev.yml up


# Exécuter les migrations dans le conteneur
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate


# Entrer dans le conteneur backend
docker-compose -f docker-compose.dev.yml exec backend bash

# Puis à l'intérieur du conteneur
python manage.py migrate
exit





# 1. Arrêter les conteneurs
docker-compose down

# 2. Supprimer le cache de build
docker builder prune -f

# 3. Reconstruire sans cache (optionnel, plus long mais plus propre)
docker-compose build --no-cache

# 4. Redémarrer
docker-compose up -d

# 5. Vérifier les logs
docker-compose logs -f frontend



Direct et précis 👍

### 🔹 Supprimer **uniquement les caches Docker** (build cache)

```bash
docker builder prune
```

### 🔹 Tout supprimer côté cache (sans toucher images/containers)

```bash
docker builder prune -a
```

### 🔹 Cache BuildKit (si activé, cas fréquent)

```bash
docker buildx prune
```

Forcer sans confirmation :

```bash
docker buildx prune -af
```

### 🔹 Vérifier l’espace libéré

```bash
docker system df
```

👉 Aucun container, image ou volume utilisé ne sera supprimé.
Juste le gras. Docker au régime 😄
