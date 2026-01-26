Cahier des charges technique backend pour le site web ARPT Guinea :

```markdown
# CAHIER DES CHARGES TECHNIQUE - BACKEND
## Site Web ARPT Guinée
### Spécifications Techniques Backend

---

## 1. ARCHITECTURE GÉNÉRALE

### 1.1 Architecture proposée
- **Type** : API RESTful (avec possibilité GraphQL en option)
- **Pattern** : MVC (Model-View-Controller) ou Clean Architecture
- **Style** : Microservices ou Monolithique modulaire (selon besoins)
- **Communication** : JSON over HTTP/HTTPS

### 1.2 Stack technique recommandée

#### Option 1 : Node.js/Express
- **Runtime** : Node.js (LTS version)
- **Framework** : Express.js ou Fastify
- **ORM/ODM** : Sequelize (SQL) ou Prisma / Mongoose (NoSQL)
- **Validation** : Joi ou Zod
- **Authentification** : JWT (jsonwebtoken) + bcrypt

#### Option 2 : Python/Django
- **Framework** : Django REST Framework
- **ORM** : Django ORM
- **Base de données** : PostgreSQL
- **Authentification** : Django Auth + JWT (djangorestframework-simplejwt)

#### Option 3 : PHP/Laravel
- **Framework** : Laravel
- **ORM** : Eloquent
- **Base de données** : MySQL/PostgreSQL
- **Authentification** : Laravel Sanctum ou Passport

### 1.3 Structure de dossiers recommandée

```
backend/
├── src/
│   ├── config/          # Configuration (DB, env, etc.)
│   ├── controllers/     # Contrôleurs (logique métier)
│   ├── models/          # Modèles de données
│   ├── routes/          # Définition des routes
│   ├── middleware/      # Middlewares (auth, validation, etc.)
│   ├── services/        # Services métier
│   ├── utils/           # Utilitaires
│   ├── validators/      # Schémas de validation
│   ├── migrations/      # Migrations DB
│   └── seeds/           # Seeders pour données initiales
├── tests/               # Tests unitaires et d'intégration
├── docs/                # Documentation API
├── .env                 # Variables d'environnement
├── .env.example         # Template variables d'environnement
└── package.json         # Dépendances (si Node.js)
```

---

## 2. BASE DE DONNÉES

### 2.1 Choix de la base de données
- **Recommandation** : PostgreSQL (relationnelle, robuste, open-source)
- **Alternative** : MySQL/MariaDB
- **Version** : PostgreSQL 14+ ou MySQL 8.0+

### 2.2 Schéma de base de données

#### 2.2.1 Table : Users (Utilisateurs)
```sql
- id (UUID ou INT, PRIMARY KEY, AUTO_INCREMENT)
- email (VARCHAR, UNIQUE, NOT NULL)
- password_hash (VARCHAR, NOT NULL)
- first_name (VARCHAR)
- last_name (VARCHAR)
- role (ENUM: 'admin', 'editor', 'viewer', 'operator')
- is_active (BOOLEAN, DEFAULT true)
- last_login (TIMESTAMP, NULLABLE)
- created_at (TIMESTAMP, DEFAULT NOW())
- updated_at (TIMESTAMP, DEFAULT NOW())
- deleted_at (TIMESTAMP, NULLABLE) -- Soft delete
```

#### 2.2.2 Table : Pages (Pages du site)
```sql
- id (UUID ou INT, PRIMARY KEY)
- slug (VARCHAR, UNIQUE, NOT NULL)
- title (VARCHAR, NOT NULL)
- content (TEXT)
- excerpt (TEXT, NULLABLE)
- meta_title (VARCHAR, NULLABLE)
- meta_description (TEXT, NULLABLE)
- status (ENUM: 'draft', 'published', 'archived')
- author_id (INT, FOREIGN KEY -> Users.id)
- published_at (TIMESTAMP, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP, NULLABLE)
```

#### 2.2.3 Table : Posts (Actualités/Articles)
```sql
- id (UUID ou INT, PRIMARY KEY)
- title (VARCHAR, NOT NULL)
- slug (VARCHAR, UNIQUE, NOT NULL)
- content (TEXT)
- excerpt (TEXT)
- featured_image (VARCHAR, NULLABLE) -- URL ou chemin
- category_id (INT, FOREIGN KEY -> Categories.id)
- author_id (INT, FOREIGN KEY -> Users.id)
- status (ENUM: 'draft', 'published', 'archived')
- views_count (INT, DEFAULT 0)
- published_at (TIMESTAMP, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP, NULLABLE)
```

#### 2.2.4 Table : Categories (Catégories)
```sql
- id (UUID ou INT, PRIMARY KEY)
- name (VARCHAR, NOT NULL)
- slug (VARCHAR, UNIQUE, NOT NULL)
- description (TEXT, NULLABLE)
- parent_id (INT, FOREIGN KEY -> Categories.id, NULLABLE) -- Hiérarchie
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2.2.5 Table : Documents (Documents téléchargeables)
```sql
- id (UUID ou INT, PRIMARY KEY)
- title (VARCHAR, NOT NULL)
- description (TEXT, NULLABLE)
- file_path (VARCHAR, NOT NULL)
- file_size (BIGINT) -- en bytes
- file_type (VARCHAR) -- MIME type
- category (ENUM: 'report', 'regulation', 'form', 'guide', 'other')
- download_count (INT, DEFAULT 0)
- is_public (BOOLEAN, DEFAULT true)
- uploaded_by (INT, FOREIGN KEY -> Users.id)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP, NULLABLE)
```

#### 2.2.6 Table : Contact_Messages (Messages de contact)
```sql
- id (UUID ou INT, PRIMARY KEY)
- name (VARCHAR, NOT NULL)
- email (VARCHAR, NOT NULL)
- subject (VARCHAR, NOT NULL)
- message (TEXT, NOT NULL)
- status (ENUM: 'new', 'read', 'replied', 'archived')
- replied_at (TIMESTAMP, NULLABLE)
- replied_by (INT, FOREIGN KEY -> Users.id, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2.2.7 Table : Forms (Formulaires dynamiques)
```sql
- id (UUID ou INT, PRIMARY KEY)
- name (VARCHAR, NOT NULL)
- slug (VARCHAR, UNIQUE, NOT NULL)
- description (TEXT, NULLABLE)
- fields (JSON) -- Structure des champs du formulaire
- is_active (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2.2.8 Table : Form_Submissions (Soumissions de formulaires)
```sql
- id (UUID ou INT, PRIMARY KEY)
- form_id (INT, FOREIGN KEY -> Forms.id)
- data (JSON) -- Données soumises
- status (ENUM: 'pending', 'processed', 'rejected')
- submitted_by (INT, FOREIGN KEY -> Users.id, NULLABLE)
- processed_by (INT, FOREIGN KEY -> Users.id, NULLABLE)
- processed_at (TIMESTAMP, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2.2.9 Table : Operators (Opérateurs - Espace opérateurs)
```sql
- id (UUID ou INT, PRIMARY KEY)
- name (VARCHAR, NOT NULL)
- email (VARCHAR, UNIQUE, NOT NULL)
- phone (VARCHAR, NULLABLE)
- address (TEXT, NULLABLE)
- license_number (VARCHAR, UNIQUE, NULLABLE)
- license_type (ENUM: 'telecom', 'postal', 'both')
- status (ENUM: 'active', 'suspended', 'revoked')
- user_id (INT, FOREIGN KEY -> Users.id, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2.2.10 Table : Licenses (Licences)
```sql
- id (UUID ou INT, PRIMARY KEY)
- operator_id (INT, FOREIGN KEY -> Operators.id)
- license_type (ENUM: 'telecom', 'postal')
- license_number (VARCHAR, UNIQUE, NOT NULL)
- issued_date (DATE)
- expiry_date (DATE)
- status (ENUM: 'active', 'expired', 'revoked')
- document_path (VARCHAR, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2.2.11 Table : Regulations (Textes réglementaires)
```sql
- id (UUID ou INT, PRIMARY KEY)
- title (VARCHAR, NOT NULL)
- reference (VARCHAR, UNIQUE, NULLABLE) -- Référence officielle
- content (TEXT)
- category (ENUM: 'law', 'decree', 'regulation', 'decision')
- effective_date (DATE, NULLABLE)
- published_date (DATE)
- document_id (INT, FOREIGN KEY -> Documents.id, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2.2.12 Table : Media (Médias - Images, vidéos)
```sql
- id (UUID ou INT, PRIMARY KEY)
- filename (VARCHAR, NOT NULL)
- original_filename (VARCHAR, NOT NULL)
- file_path (VARCHAR, NOT NULL)
- file_type (VARCHAR) -- MIME type
- file_size (BIGINT)
- width (INT, NULLABLE) -- Pour images
- height (INT, NULLABLE) -- Pour images
- alt_text (VARCHAR, NULLABLE)
- uploaded_by (INT, FOREIGN KEY -> Users.id)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2.2.13 Table : Settings (Paramètres du site)
```sql
- id (UUID ou INT, PRIMARY KEY)
- key (VARCHAR, UNIQUE, NOT NULL)
- value (TEXT)
- type (ENUM: 'string', 'number', 'boolean', 'json')
- description (TEXT, NULLABLE)
- updated_at (TIMESTAMP)
```

#### 2.2.14 Table : Newsletter_Subscribers (Abonnés newsletter)
```sql
- id (UUID ou INT, PRIMARY KEY)
- email (VARCHAR, UNIQUE, NOT NULL)
- status (ENUM: 'active', 'unsubscribed')
- subscribed_at (TIMESTAMP, DEFAULT NOW())
- unsubscribed_at (TIMESTAMP, NULLABLE)
- token (VARCHAR, UNIQUE) -- Pour désinscription
```

### 2.3 Index et optimisations
- Index sur colonnes fréquemment recherchées (email, slug, status)
- Index composite pour requêtes complexes
- Index full-text pour recherche (si PostgreSQL)
- Partitioning pour tables volumineuses (si nécessaire)

### 2.4 Relations et contraintes
- Foreign keys avec ON DELETE CASCADE ou RESTRICT selon logique métier
- Contraintes UNIQUE où nécessaire
- Contraintes CHECK pour validation de données
- Triggers pour updated_at automatique

---

## 3. API REST - ENDPOINTS

### 3.1 Authentification

#### POST /api/auth/register
- **Description** : Création de compte utilisateur
- **Body** : `{ email, password, first_name, last_name, role? }`
- **Response** : `{ user, token }`
- **Permissions** : Admin uniquement (pour création de comptes)

#### POST /api/auth/login
- **Description** : Connexion utilisateur
- **Body** : `{ email, password }`
- **Response** : `{ user, token, refresh_token }`

#### POST /api/auth/refresh
- **Description** : Rafraîchir le token JWT
- **Body** : `{ refresh_token }`
- **Response** : `{ token, refresh_token }`

#### POST /api/auth/logout
- **Description** : Déconnexion
- **Headers** : `Authorization: Bearer {token}`
- **Response** : `{ message: "Logged out" }`

#### POST /api/auth/forgot-password
- **Description** : Demande de réinitialisation de mot de passe
- **Body** : `{ email }`
- **Response** : `{ message: "Reset link sent" }`

#### POST /api/auth/reset-password
- **Description** : Réinitialisation du mot de passe
- **Body** : `{ token, new_password }`
- **Response** : `{ message: "Password reset successful" }`

### 3.2 Pages

#### GET /api/pages
- **Description** : Liste des pages (paginée)
- **Query params** : `?page=1&limit=10&status=published&search=...`
- **Response** : `{ data: [...], pagination: {...} }`
- **Permissions** : Public (si published) ou Admin/Editor

#### GET /api/pages/:slug
- **Description** : Détails d'une page par slug
- **Response** : `{ page: {...} }`
- **Permissions** : Public (si published) ou Admin/Editor

#### POST /api/pages
- **Description** : Créer une page
- **Body** : `{ slug, title, content, status, ... }`
- **Response** : `{ page: {...} }`
- **Permissions** : Admin, Editor

#### PUT /api/pages/:id
- **Description** : Mettre à jour une page
- **Body** : `{ title, content, status, ... }`
- **Response** : `{ page: {...} }`
- **Permissions** : Admin, Editor

#### DELETE /api/pages/:id
- **Description** : Supprimer une page (soft delete)
- **Response** : `{ message: "Deleted" }`
- **Permissions** : Admin

### 3.3 Posts (Actualités)

#### GET /api/posts
- **Description** : Liste des articles (paginée, filtrable)
- **Query params** : `?page=1&limit=10&category=...&status=published&search=...&sort=created_at:desc`
- **Response** : `{ data: [...], pagination: {...} }`

#### GET /api/posts/:id
- **Description** : Détails d'un article
- **Response** : `{ post: {...} }`
- **Increment** : views_count automatiquement

#### GET /api/posts/:slug
- **Description** : Détails par slug
- **Response** : `{ post: {...} }`

#### POST /api/posts
- **Description** : Créer un article
- **Body** : `{ title, slug, content, category_id, featured_image, status, ... }`
- **Response** : `{ post: {...} }`
- **Permissions** : Admin, Editor

#### PUT /api/posts/:id
- **Description** : Mettre à jour un article
- **Body** : `{ title, content, status, ... }`
- **Response** : `{ post: {...} }`
- **Permissions** : Admin, Editor

#### DELETE /api/posts/:id
- **Description** : Supprimer un article
- **Response** : `{ message: "Deleted" }`
- **Permissions** : Admin

### 3.4 Categories

#### GET /api/categories
- **Description** : Liste des catégories
- **Query params** : `?parent_id=...`
- **Response** : `{ data: [...] }`

#### GET /api/categories/:id
- **Description** : Détails d'une catégorie
- **Response** : `{ category: {...} }`

#### POST /api/categories
- **Description** : Créer une catégorie
- **Body** : `{ name, slug, description, parent_id? }`
- **Response** : `{ category: {...} }`
- **Permissions** : Admin, Editor

#### PUT /api/categories/:id
- **Description** : Mettre à jour une catégorie
- **Body** : `{ name, description, ... }`
- **Response** : `{ category: {...} }`
- **Permissions** : Admin, Editor

#### DELETE /api/categories/:id
- **Description** : Supprimer une catégorie
- **Response** : `{ message: "Deleted" }`
- **Permissions** : Admin

### 3.5 Documents

#### GET /api/documents
- **Description** : Liste des documents (paginée, filtrable)
- **Query params** : `?page=1&limit=10&category=...&search=...`
- **Response** : `{ data: [...], pagination: {...} }`

#### GET /api/documents/:id
- **Description** : Détails d'un document
- **Response** : `{ document: {...} }`

#### GET /api/documents/:id/download
- **Description** : Télécharger un document
- **Response** : File download
- **Increment** : download_count automatiquement

#### POST /api/documents
- **Description** : Upload un document
- **Body** : Multipart/form-data (file, title, description, category, ...)
- **Response** : `{ document: {...} }`
- **Permissions** : Admin, Editor

#### DELETE /api/documents/:id
- **Description** : Supprimer un document
- **Response** : `{ message: "Deleted" }`
- **Permissions** : Admin

### 3.6 Contact

#### POST /api/contact
- **Description** : Envoyer un message de contact
- **Body** : `{ name, email, subject, message }`
- **Response** : `{ message: "Sent successfully", id }`
- **Action** : Envoi email de notification

#### GET /api/contact/messages
- **Description** : Liste des messages (admin)
- **Query params** : `?page=1&limit=10&status=...`
- **Response** : `{ data: [...], pagination: {...} }`
- **Permissions** : Admin, Editor

#### GET /api/contact/messages/:id
- **Description** : Détails d'un message
- **Response** : `{ message: {...} }`
- **Permissions** : Admin, Editor

#### PUT /api/contact/messages/:id/status
- **Description** : Changer le statut d'un message
- **Body** : `{ status: 'read' | 'replied' | 'archived' }`
- **Response** : `{ message: {...} }`
- **Permissions** : Admin, Editor

### 3.7 Formulaires (Espace opérateurs)

#### GET /api/forms
- **Description** : Liste des formulaires disponibles
- **Response** : `{ data: [...] }`

#### GET /api/forms/:id
- **Description** : Détails d'un formulaire (structure)
- **Response** : `{ form: {...} }`

#### POST /api/forms/:id/submit
- **Description** : Soumettre un formulaire
- **Body** : `{ data: {...} }` (données du formulaire)
- **Response** : `{ submission: {...}, message: "Submitted" }`
- **Action** : Notification email si nécessaire

#### GET /api/forms/submissions
- **Description** : Liste des soumissions (admin)
- **Query params** : `?page=1&limit=10&form_id=...&status=...`
- **Response** : `{ data: [...], pagination: {...} }`
- **Permissions** : Admin, Editor

#### GET /api/forms/submissions/:id
- **Description** : Détails d'une soumission
- **Response** : `{ submission: {...} }`
- **Permissions** : Admin, Editor

#### PUT /api/forms/submissions/:id/status
- **Description** : Changer le statut d'une soumission
- **Body** : `{ status: 'processed' | 'rejected' }`
- **Response** : `{ submission: {...} }`
- **Permissions** : Admin

### 3.8 Opérateurs

#### GET /api/operators
- **Description** : Liste des opérateurs
- **Query params** : `?page=1&limit=10&status=...&search=...`
- **Response** : `{ data: [...], pagination: {...} }`
- **Permissions** : Admin, Editor (liste limitée pour opérateurs)

#### GET /api/operators/:id
- **Description** : Détails d'un opérateur
- **Response** : `{ operator: {...} }`
- **Permissions** : Admin, Editor, ou opérateur propriétaire

#### POST /api/operators
- **Description** : Créer un opérateur
- **Body** : `{ name, email, phone, address, license_number, ... }`
- **Response** : `{ operator: {...} }`
- **Permissions** : Admin

#### PUT /api/operators/:id
- **Description** : Mettre à jour un opérateur
- **Body** : `{ name, email, ... }`
- **Response** : `{ operator: {...} }`
- **Permissions** : Admin, ou opérateur propriétaire (champs limités)

### 3.9 Licences

#### GET /api/licenses
- **Description** : Liste des licences
- **Query params** : `?page=1&limit=10&operator_id=...&status=...`
- **Response** : `{ data: [...], pagination: {...} }`
- **Permissions** : Admin, Editor

#### GET /api/licenses/:id
- **Description** : Détails d'une licence
- **Response** : `{ license: {...} }`
- **Permissions** : Admin, Editor

#### POST /api/licenses
- **Description** : Créer une licence
- **Body** : `{ operator_id, license_type, license_number, issued_date, expiry_date, ... }`
- **Response** : `{ license: {...} }`
- **Permissions** : Admin

#### PUT /api/licenses/:id
- **Description** : Mettre à jour une licence
- **Body** : `{ status, expiry_date, ... }`
- **Response** : `{ license: {...} }`
- **Permissions** : Admin

### 3.10 Réglementations

#### GET /api/regulations
- **Description** : Liste des textes réglementaires
- **Query params** : `?page=1&limit=10&category=...&search=...`
- **Response** : `{ data: [...], pagination: {...} }`

#### GET /api/regulations/:id
- **Description** : Détails d'un texte réglementaire
- **Response** : `{ regulation: {...} }`

#### POST /api/regulations
- **Description** : Créer un texte réglementaire
- **Body** : `{ title, reference, content, category, effective_date, ... }`
- **Response** : `{ regulation: {...} }`
- **Permissions** : Admin, Editor

#### PUT /api/regulations/:id
- **Description** : Mettre à jour un texte réglementaire
- **Body** : `{ title, content, ... }`
- **Response** : `{ regulation: {...} }`
- **Permissions** : Admin, Editor

### 3.11 Médias

#### GET /api/media
- **Description** : Liste des médias (paginée)
- **Query params** : `?page=1&limit=20&type=image&search=...`
- **Response** : `{ data: [...], pagination: {...} }`
- **Permissions** : Admin, Editor

#### GET /api/media/:id
- **Description** : Détails d'un média
- **Response** : `{ media: {...} }`

#### POST /api/media/upload
- **Description** : Upload un fichier média
- **Body** : Multipart/form-data (file)
- **Response** : `{ media: {...} }`
- **Permissions** : Admin, Editor
- **Limites** : Taille max, types autorisés

#### DELETE /api/media/:id
- **Description** : Supprimer un média
- **Response** : `{ message: "Deleted" }`
- **Permissions** : Admin, Editor

### 3.12 Paramètres

#### GET /api/settings
- **Description** : Liste des paramètres (ou par groupe)
- **Query params** : `?group=...`
- **Response** : `{ data: {...} }`
- **Permissions** : Admin, Editor

#### GET /api/settings/:key
- **Description** : Valeur d'un paramètre
- **Response** : `{ key, value, type }`

#### PUT /api/settings/:key
- **Description** : Mettre à jour un paramètre
- **Body** : `{ value }`
- **Response** : `{ setting: {...} }`
- **Permissions** : Admin

### 3.13 Newsletter

#### POST /api/newsletter/subscribe
- **Description** : S'abonner à la newsletter
- **Body** : `{ email }`
- **Response** : `{ message: "Subscribed" }`

#### POST /api/newsletter/unsubscribe
- **Description** : Se désabonner
- **Body** : `{ email, token }` ou `{ token }`
- **Response** : `{ message: "Unsubscribed" }`

#### GET /api/newsletter/subscribers
- **Description** : Liste des abonnés (admin)
- **Query params** : `?page=1&limit=50&status=...`
- **Response** : `{ data: [...], pagination: {...} }`
- **Permissions** : Admin

### 3.14 Recherche

#### GET /api/search
- **Description** : Recherche globale
- **Query params** : `?q=...&type=all|pages|posts|documents&page=1&limit=10`
- **Response** : `{ results: { pages: [...], posts: [...], documents: [...] }, total }`

### 3.15 Statistiques (Admin)

#### GET /api/stats/overview
- **Description** : Vue d'ensemble des statistiques
- **Response** : `{ posts_count, pages_count, documents_count, users_count, ... }`
- **Permissions** : Admin

#### GET /api/stats/analytics
- **Description** : Statistiques d'utilisation
- **Query params** : `?period=7d|30d|1y`
- **Response** : `{ views, downloads, submissions, ... }`
- **Permissions** : Admin

---

## 4. AUTHENTIFICATION ET AUTORISATION

### 4.1 JWT (JSON Web Tokens)
- **Access Token** : Durée de vie courte (15 min - 1h)
- **Refresh Token** : Durée de vie longue (7-30 jours)
- **Algorithme** : HS256 ou RS256
- **Stockage** : Access token en mémoire, Refresh token en HTTP-only cookie ou DB

### 4.2 Rôles et permissions

#### Rôles
- **admin** : Accès complet
- **editor** : Gestion de contenu (créer, modifier, publier)
- **viewer** : Lecture seule
- **operator** : Accès limité à l'espace opérateurs

#### Matrice de permissions
| Ressource | Admin | Editor | Viewer | Operator |
|-----------|-------|--------|--------|----------|
| Pages (CRUD) | ✓ | ✓ | R | - |
| Posts (CRUD) | ✓ | ✓ | R | - |
| Documents | ✓ | ✓ | R | R (limité) |
| Contact messages | ✓ | ✓ | R | - |
| Form submissions | ✓ | ✓ | R | R (propre) |
| Operators | ✓ | R | R | R (propre) |
| Licenses | ✓ | R | R | R (propre) |
| Users | ✓ | - | - | - |
| Settings | ✓ | - | - | - |

### 4.3 Middleware d'authentification
- Vérification du token JWT
- Validation de l'expiration
- Vérification du rôle utilisateur
- Gestion des erreurs (401, 403)

### 4.4 Sécurité des mots de passe
- Hash avec bcrypt (salt rounds: 10-12)
- Validation : minimum 8 caractères, complexité
- Politique de réinitialisation sécurisée

---

## 5. VALIDATION DES DONNÉES

### 5.1 Schémas de validation
- Validation côté serveur obligatoire
- Bibliothèque : Joi (Node.js), Pydantic (Python), ou équivalent
- Messages d'erreur clairs et localisés

### 5.2 Règles de validation communes
- **Email** : Format valide, unique si nécessaire
- **Slug** : Format URL-friendly, unique
- **Dates** : Format ISO 8601, validation logique
- **Fichiers** : Taille max, types MIME autorisés
- **Textes** : Longueur min/max, sanitization XSS

### 5.3 Sanitization
- Protection XSS (escape HTML)
- Protection contre injection SQL (ORM/parametrized queries)
- Validation des uploads (type, taille, contenu)

---

## 6. GESTION DES FICHIERS

### 6.1 Upload de fichiers
- **Documents** : PDF, DOC, DOCX (max 10-20 MB)
- **Images** : JPG, PNG, WebP (max 5 MB)
- **Vidéos** : MP4, WebM (max 50-100 MB, si applicable)

### 6.2 Stockage
- **Option 1** : Système de fichiers local (dossier uploads/)
- **Option 2** : Cloud storage (AWS S3, Cloudinary, etc.)
- **Structure** : `/uploads/{type}/{year}/{month}/{filename}`

### 6.3 Traitement des images
- Génération de thumbnails
- Redimensionnement automatique
- Compression (optimisation)
- Formats multiples (WebP, fallback JPG/PNG)

### 6.4 Sécurité des uploads
- Validation du type MIME réel (pas seulement extension)
- Scan antivirus (si possible)
- Noms de fichiers sécurisés (pas de caractères spéciaux)
- Limitation de taille par type

---

## 7. EMAIL ET NOTIFICATIONS

### 7.1 Service d'email
- **SMTP** : Configuration serveur SMTP
- **Service tiers** : SendGrid, Mailgun, AWS SES, ou équivalent
- **Templates** : Système de templates d'email

### 7.2 Emails à implémenter
- Confirmation d'inscription
- Réinitialisation de mot de passe
- Notification nouveau message de contact
- Notification nouvelle soumission de formulaire
- Newsletter (si applicable)
- Notifications système (licences expirées, etc.)

### 7.3 Queue pour emails
- File d'attente (Redis, RabbitMQ, ou queue en DB)
- Traitement asynchrone
- Retry en cas d'échec
- Logging des envois

---

## 8. LOGGING ET MONITORING

### 8.1 Logging
- **Niveaux** : ERROR, WARN, INFO, DEBUG
- **Format** : JSON (pour parsing) ou format structuré
- **Fichiers** : Rotation automatique, archivage
- **Informations** : Timestamp, niveau, message, contexte, user_id, IP

### 8.2 Événements à logger
- Connexions/déconnexions
- Actions CRUD importantes
- Erreurs et exceptions
- Tentatives d'accès non autorisées
- Uploads de fichiers
- Envois d'emails

### 8.3 Monitoring
- Health check endpoint : `GET /api/health`
- Métriques de performance (temps de réponse)
- Monitoring de la base de données
- Alertes sur erreurs critiques

---

## 9. TESTS

### 9.1 Types de tests
- **Tests unitaires** : Fonctions isolées (coverage > 80%)
- **Tests d'intégration** : API endpoints, DB interactions
- **Tests E2E** : Scénarios complets (optionnel)

### 9.2 Outils recommandés
- **Node.js** : Jest, Supertest
- **Python** : pytest, pytest-django
- **PHP** : PHPUnit

### 9.3 Tests à implémenter
- Authentification (login, register, refresh)
- CRUD pour chaque ressource principale
- Validation des données
- Permissions et autorisations
- Upload de fichiers
- Gestion d'erreurs

---

## 10. SÉCURITÉ

### 10.1 Protection contre les attaques
- **SQL Injection** : ORM/parametrized queries
- **XSS** : Sanitization, Content Security Policy
- **CSRF** : Tokens CSRF pour formulaires
- **Rate Limiting** : Limitation de requêtes (express-rate-limit)
- **DDoS** : Protection au niveau infrastructure

### 10.2 Headers de sécurité
- **CORS** : Configuration stricte (origines autorisées)
- **Helmet.js** (Node.js) ou équivalent : Headers sécurisés
- **HTTPS** : Obligatoire en production

### 10.3 Gestion des secrets
- Variables d'environnement (.env)
- Secrets dans gestionnaire de secrets (AWS Secrets Manager, etc.)
- Pas de secrets dans le code source
- Rotation des clés JWT

### 10.4 Audit et conformité
- Logs d'audit pour actions sensibles
- Conformité RGPD (si applicable) : droit à l'oubli, export données

---

## 11. PERFORMANCE ET OPTIMISATION

### 11.1 Base de données
- Index sur colonnes fréquemment requêtées
- Requêtes optimisées (éviter N+1 queries)
- Pagination pour listes
- Cache des requêtes fréquentes (Redis)

### 11.2 API
- Compression Gzip
- Pagination standardisée
- Filtrage et tri côté serveur
- Limitation de profondeur de relations (éviter over-fetching)

### 11.3 Cache
- **Redis** : Cache de sessions, données fréquentes
- **Cache HTTP** : Headers Cache-Control pour ressources statiques
- Invalidation de cache intelligente

---

## 12. DOCUMENTATION API

### 12.1 Format
- **Swagger/OpenAPI** : Documentation interactive
- **Postman Collection** : Collection d'exemples
- **README** : Guide de démarrage, installation

### 12.2 Contenu
- Description de chaque endpoint
- Paramètres (query, body, path)
- Exemples de requêtes/réponses
- Codes d'erreur possibles
- Schémas de données

---

## 13. DÉPLOIEMENT

### 13.1 Environnements
- **Development** : Local
- **Staging** : Pré-production (tests)
- **Production** : Environnement final

### 13.2 Configuration
- Variables d'environnement par environnement
- Fichiers .env.example pour référence
- Configuration DB, SMTP, secrets différenciés

### 13.3 CI/CD (optionnel)
- Tests automatiques
- Build automatique
- Déploiement automatique (staging/production)

### 13.4 Migration de base de données
- Système de migrations versionnées
- Rollback possible
- Scripts de migration pour données initiales

---

## 14. VARIABLES D'ENVIRONNEMENT

### 14.1 Configuration requise
```env
# Application
NODE_ENV=development|production
PORT=3000
API_PREFIX=/api

# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arpt_guinea
DB_USER=arpt_user
DB_PASSWORD=secure_password
DB_SSL=false

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@arpt.gov.gn

# Upload
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:3000,https://arpt.gov.gn

# Redis (si utilisé)
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

---

## 15. LIVRABLES

### 15.1 Code source
- Code backend complet et documenté
- Structure de dossiers organisée
- README avec instructions d'installation

### 15.2 Base de données
- Scripts de migration
- Seeders pour données initiales
- Documentation du schéma

### 15.3 Documentation
- Documentation API (Swagger)
- Guide de déploiement
- Guide d'administration
- Documentation technique

### 15.4 Tests
- Suite de tests complète
- Rapport de couverture de code

---

## 16. CALENDRIER ET PHASES

### Phase 1 : Setup et infrastructure (Semaine 1-2)
- Configuration projet
- Setup base de données
- Structure de dossiers
- Configuration authentification

### Phase 2 : Core API (Semaine 3-5)
- Authentification complète
- CRUD Pages, Posts, Categories
- Gestion médias
- Gestion documents

### Phase 3 : Fonctionnalités avancées (Semaine 6-7)
- Espace opérateurs
- Formulaires dynamiques
- Contact et notifications
- Recherche

### Phase 4 : Tests et optimisation (Semaine 8)
- Tests complets
- Optimisation performance
- Documentation

### Phase 5 : Déploiement (Semaine 9)
- Déploiement staging
- Tests d'intégration
- Déploiement production
- Formation

---

**Document version** : 1.0  
**Date** : [Date actuelle]  
**Statut** : Prêt pour développement
```

Ce cahier des charges technique backend couvre les aspects essentiels. Points à adapter selon vos choix techniques :

1. Stack (Node.js, Python, PHP)
2. Base de données (PostgreSQL, MySQL)
3. Services externes (email, storage)

Souhaitez-vous que je détaille une section spécifique ou que je crée des exemples de code pour certaines fonctionnalités ?