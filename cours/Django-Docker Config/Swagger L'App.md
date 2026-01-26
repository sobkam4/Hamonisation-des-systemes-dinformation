

# Voici les Different chemin:

Ouvrez votre navigateur et allez sur :
Swagger UI : http://localhost:8000/swagger/
ReDoc : http://localhost:8000/redoc/
JSON Schema : http://localhost:8000/swagger.json
YAML Schema : http://localhost:8000/swagger.yaml


# Tester Les API:

Voici comment utiliser Swagger pour tester vos APIs.

## Structure de l'interface Swagger

1. Groupes par tags (Recherche, Authentification, Posts, Documents, etc.)
2. Endpoints listés sous chaque tag
3. Méthodes HTTP (GET, POST, PUT, DELETE, PATCH)

## Guide pas à pas pour tester un endpoint

### 1. Tester un endpoint GET (lecture)

Exemple : `GET /api/posts/`

1. Trouvez la section "Posts" dans Swagger
2. Cliquez sur `GET /api/posts/` pour l’étendre
3. Cliquez sur "Try it out"
4. Renseignez les paramètres si nécessaire (filtres, pagination, etc.)
5. Cliquez sur "Execute"
6. Consultez la réponse :
   - Code de statut (200 = succès, 404 = non trouvé, etc.)
   - Body avec les données JSON
   - Headers de la réponse

### 2. Tester un endpoint POST (création)

Exemple : `POST /api/posts/`

1. Cliquez sur `POST /api/posts/` et "Try it out"
2. Remplissez le body JSON dans l’éditeur :
   ```json
   {
     "title": "Mon premier article",
     "content": "Contenu de l'article",
     "excerpt": "Résumé",
     "category": 1,
     "status": "draft"
   }
   ```
3. Cliquez sur "Execute"
4. Vérifiez la réponse (201 Created avec les données créées)

### 3. Authentification avec JWT

Pour les endpoints protégés :

1. En haut à droite, cliquez sur "Authorize"
2. Dans "Bearer", entrez votre token JWT (sans "Bearer ")
   - Format : `eyJ0eXAiOiJKV1QiLCJhbGc...`
3. Cliquez sur "Authorize", puis "Close"
4. Les requêtes suivantes incluront automatiquement le token

Pour obtenir un token :
1. Utilisez `POST /api/auth/login/` avec email/password
2. Copiez le `access` du résultat
3. Utilisez ce token dans "Authorize"

### 4. Tester un endpoint avec paramètres

Exemple : `GET /api/posts/{slug}/`

1. Cliquez sur l’endpoint et "Try it out"
2. Renseignez le paramètre `slug` (ex: "mon-article")
3. Cliquez sur "Execute"

### 5. Tester la recherche globale

Exemple : `GET /api/search/`

1. Ouvrez "Recherche" → `GET /api/search/`
2. "Try it out"
3. Paramètres :
   - `q` : terme de recherche (ex: "django")
   - `type` : "all", "pages", "posts", ou "documents"
   - `page` : numéro de page (défaut: 1)
4. "Execute"

## Exemple pratique complet

### Scénario : Créer un post et le récupérer

1. Authentification :
   - `POST /api/auth/login/`
   - Body :
     ```json
     {
       "email": "votre@email.com",
       "password": "votre_mot_de_passe"
     }
     ```
   - Copiez le `access` de la réponse

2. Autorisation :
   - Cliquez sur "Authorize" en haut à droite
   - Collez le token dans "Bearer"
   - "Authorize" puis "Close"

3. Créer un post :
   - `POST /api/posts/`
   - Body :
     ```json
     {
       "title": "Test Swagger",
       "content": "Contenu du test",
       "excerpt": "Résumé",
       "category": 1,
       "status": "published"
     }
     ```
   - "Execute"
   - Notez le `slug` dans la réponse

4. Récupérer le post :
   - `GET /api/posts/{slug}/`
   - Entrez le `slug` noté
   - "Execute"

## Conseils

1. Schémas : Consultez "Schemas" en bas pour voir les modèles de données
2. Codes de statut :
   - 200 = Succès
   - 201 = Créé
   - 400 = Erreur de validation
   - 401 = Non authentifié
   - 403 = Interdit
   - 404 = Non trouvé
   - 500 = Erreur serveur
3. Validation : En cas d’erreur 400, vérifiez le body de la réponse pour les détails
4. Curl : Vous pouvez copier la commande curl générée pour tester en ligne de commande

## Résumé visuel

```
1. Trouver l'endpoint → Cliquer dessus
2. Cliquer "Try it out"
3. Remplir les paramètres/body si nécessaire
4. Cliquer "Execute"
5. Lire la réponse (code + body)
```