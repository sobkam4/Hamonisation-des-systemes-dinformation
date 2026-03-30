# Documentation API - ERP Location Immobilière

## Base URL
- Développement: `http://localhost:8000/api/`
- Production: `https://your-domain.com/api/`

## Authentification

### Login
```http
POST /auth/login/
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "permissions": {
      "role": "admin",
      "modules": ["biens", "clients", "contrats", "paiements", "depenses", "analytics"]
    }
  }
}
```

### Register
```http
POST /auth/register/
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "role": "gestionnaire",
  "first_name": "John",
  "last_name": "Doe",
  "telephone": "+221 77 123 45 67"
}
```

### Refresh Token
```http
POST /auth/refresh/
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Headers
Toutes les requêtes authentifiées doivent inclure:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## BIENS

### Lister les biens
```http
GET /biens/
```

**Query Parameters:**
- `statut`: disponible, loue, maintenance
- `type`: appartement, maison, local_commercial
- `search`: recherche par nom ou adresse

**Response:**
```json
[
  {
    "id": 1,
    "nom": "Appartement Fass",
    "type_bien": "appartement",
    "type_bien_display": "Appartement",
    "adresse": "Fass, Dakar",
    "prix_location": "150000.00",
    "statut": "disponible",
    "statut_display": "Disponible",
    "superficie": "120.50",
    "nombre_pieces": 3,
    "est_disponible": true,
    "peut_etre_loue": true,
    "date_creation": "2024-01-15T10:30:00Z"
  }
]
```

### Créer un bien
```http
POST /biens/
```

**Request Body:**
```json
{
  "nom": "Villa Almadies",
  "type_bien": "maison",
  "adresse": "Almadies, Dakar",
  "prix_location": "300000.00",
  "superficie": "250.00",
  "nombre_pieces": 5,
  "description": "Belle villa avec jardin"
}
```

### Détails d'un bien
```http
GET /biens/{id}/
```

### Changer statut d'un bien
```http
PUT /biens/{id}/changer-statut/
```

**Request Body:**
```json
{
  "statut": "loue"
}
```

### Statistiques des biens
```http
GET /biens/statistiques/
```

**Response:**
```json
{
  "total_biens": 15,
  "biens_disponibles": 8,
  "biens_loues": 6,
  "biens_maintenance": 1,
  "par_type": [
    {"type_bien": "appartement", "count": 8},
    {"type_bien": "maison", "count": 5},
    {"type_bien": "local_commercial", "count": 2}
  ],
  "taux_occupation": 40.0
}
```

---

## CLIENTS

### Lister les clients
```http
GET /clients/
```

**Query Parameters:**
- `defaut_paiement`: true/false
- `search`: recherche par nom, email, téléphone

**Response:**
```json
[
  {
    "id": 1,
    "nom": "Diop",
    "prenom": "Mamadou",
    "nom_complet": "Mamadou Diop",
    "email": "mamadou@example.com",
    "telephone": "+221 77 123 45 67",
    "defaut_paiement": false,
    "nombre_contrats_actifs": 2,
    "date_creation": "2024-01-10T14:20:00Z"
  }
]
```

### Créer un client
```http
POST /clients/
```

**Request Body:**
```json
{
  "nom": "Diop",
  "prenom": "Mamadou",
  "email": "mamadou@example.com",
  "telephone": "+221 77 123 45 67",
  "adresse": "Plateau, Dakar",
  "piece_identite": "CNI",
  "numero_piece_identite": "1234567890123",
  "notes": "Client fidèle"
}
```

### Contrats d'un client
```http
GET /clients/{id}/contrats/
```

### Marquer défaut de paiement
```http
PUT /clients/{id}/marquer-defaut/
```

**Request Body:**
```json
{
  "action": "marquer"  // ou "lever"
}
```

---

## CONTRATS

### Lister les contrats
```http
GET /contrats/
```

**Query Parameters:**
- `statut`: actif, termine, resilie, en_attente
- `client`: ID du client
- `bien`: ID du bien
- `search`: recherche

**Response:**
```json
[
  {
    "id": 1,
    "client": 1,
    "client_nom": "Mamadou Diop",
    "bien": 1,
    "bien_nom": "Appartement Fass",
    "date_debut": "2024-01-01",
    "date_fin": "2024-12-31",
    "montant_mensuel": "150000.00",
    "caution": "300000.00",
    "statut": "actif",
    "statut_display": "Actif",
    "est_actif": true,
    "est_expire": false,
    "duree_mois": 12,
    "date_creation": "2024-01-01T09:00:00Z"
  }
]
```

### Créer un contrat
```http
POST /contrats/
```

**Request Body:**
```json
{
  "client": 1,
  "bien": 1,
  "date_debut": "2024-01-01",
  "date_fin": "2024-12-31",
  "montant_mensuel": "150000.00",
  "caution": "300000.00",
  "conditions_particulieres": "Pas d'animaux autorisés"
}
```

### Résilier un contrat
```http
PUT /contrats/{id}/resilier/
```

**Request Body:**
```json
{
  "motif": "Non-paiement du loyer"
}
```

### Paiements d'un contrat
```http
GET /contrats/{id}/paiements/
```

### Solde d'un contrat
```http
GET /contrats/{id}/solde/
```

---

## PAIEMENTS

### Lister les paiements
```http
GET /paiements/
```

**Query Parameters:**
- `statut`: en_attente, partiel, paye, en_retard
- `contrat`: ID du contrat
- `date_debut`: YYYY-MM-DD
- `date_fin`: YYYY-MM-DD
- `search`: recherche

**Response:**
```json
[
  {
    "id": 1,
    "contrat": 1,
    "client_nom": "Mamadou Diop",
    "bien_nom": "Appartement Fass",
    "date_paiement": "2024-01-05",
    "date_echeance": "2024-01-01",
    "montant_du": "150000.00",
    "montant": "150000.00",
    "solde_restant": "0.00",
    "type_paiement": "virement",
    "type_paiement_display": "Virement bancaire",
    "statut": "paye",
    "statut_display": "Payé",
    "reference_paiement": "PAY-20240105-ABC12345",
    "est_en_retard": false,
    "jours_retard": 0,
    "date_creation": "2024-01-05T10:15:00Z"
  }
]
```

### Marquer un paiement comme payé
```http
PUT /paiements/{id}/marquer-paye/
```

**Request Body:**
```json
{
  "montant_paye": "150000.00"
}
```

### Générer référence de paiement
```http
PUT /paiements/{id}/generer-reference/
```

### Paiements en retard
```http
GET /paiements/en-retard/
```

### Générer échéances pour un contrat
```http
POST /paiements/generer-echeances/{contrat_id}/
```

---

## DÉPENSES

### Lister les dépenses
```http
GET /depenses/
```

**Query Parameters:**
- `categorie`: ID de la catégorie
- `bien`: ID du bien
- `type`: reparation, entretien, taxe, assurance
- `date_debut`: YYYY-MM-DD
- `date_fin`: YYYY-MM-DD

**Response:**
```json
[
  {
    "id": 1,
    "date": "2024-01-15",
    "categorie": 1,
    "categorie_nom": "Réparations",
    "description": "Réparation climatisation",
    "montant": "50000.00",
    "type_depense": "reparation",
    "type_depense_display": "Réparation",
    "bien": 1,
    "bien_nom": "Appartement Fass",
    "fournisseur": "ClimService",
    "numero_facture": "FAC-2024-001",
    "date_creation": "2024-01-15T16:30:00Z"
  }
]
```

### Créer une dépense
```http
POST /depenses/
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "categorie": 1,
  "description": "Réparation climatisation",
  "montant": "50000.00",
  "type_depense": "reparation",
  "bien": 1,
  "fournisseur": "ClimService",
  "numero_facture": "FAC-2024-001",
  "notes": "Urgent"
}
```

### Catégories de dépenses
```http
GET /depenses/categories/
```

### Importer des dépenses (CSV)
```http
POST /depenses/import-csv/
Content-Type: multipart/form-data
```

**Format CSV attendu:**
```csv
date,categorie,description,montant,type_depense,fournisseur,numero_facture
2024-01-15,Réparations,Réparation climatisation,50000.00,reparation,ClimService,FAC-2024-001
```

---

## ANALYTICS

### Dashboard principal
```http
GET /analytics/dashboard/
```

**Response:**
```json
{
  "biens": {
    "total": 15,
    "disponibles": 8,
    "loues": 6,
    "maintenance": 1,
    "taux_occupation": 40.0
  },
  "contrats": {
    "total": 12,
    "actifs": 6,
    "revenu_mensuel": "900000.00"
  },
  "paiements": {
    "total_ce_mois": "850000.00",
    "en_retard": 2,
    "total_encaisse": "10200000.00"
  },
  "depenses": {
    "total_ce_mois": "150000.00",
    "total_annuel": "1800000.00"
  },
  "cashflow_mois": "700000.00"
}
```

### Cashflow mensuel
```http
GET /analytics/cashflow/?annee=2024
```

**Response:**
```json
{
  "annee": 2024,
  "donnees": [
    {
      "mois": 1,
      "nom_mois": "January",
      "revenus": "850000.00",
      "depenses": "150000.00",
      "cashflow": "700000.00"
    }
  ],
  "total_annuel": {
    "revenus": "10200000.00",
    "depenses": "1800000.00",
    "cashflow": "8400000.00"
  }
}
```

### Projections financières
```http
GET /analytics/projection/?mois=12
```

### Calculer ROI
```http
POST /analytics/indicateurs/calculer-roi/
```

**Request Body:**
```json
{
  "periode_debut": "2024-01-01",
  "periode_fin": "2024-12-31"
}
```

---

## CODES D'ERREUR

### 400 Bad Request
- Données invalides ou manquantes
- Validation échouée

### 401 Unauthorized
- Token manquant ou invalide
- Permissions insuffisantes

### 403 Forbidden
- Accès refusé pour le rôle actuel

### 404 Not Found
- Ressource non trouvée

### 500 Internal Server Error
- Erreur serveur

---

## LIMITES

- Pagination: 20 résultats par page
- Upload fichiers: Max 10MB
- Rate limiting: 100 requêtes/minute par utilisateur

---

## EXEMPLES D'UTILISATION

### JavaScript (Fetch)
```javascript
// Login
const loginResponse = await fetch('/api/auth/login/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'admin',
    password: 'password'
  })
});
const {access} = await loginResponse.json();

// Lister les biens
const biensResponse = await fetch('/api/biens/', {
  headers: {
    'Authorization': `Bearer ${access}`,
    'Content-Type': 'application/json'
  }
});
const biens = await biensResponse.json();
```

### Python (Requests)
```python
import requests

# Login
login_data = {'username': 'admin', 'password': 'password'}
response = requests.post('http://localhost:8000/api/auth/login/', json=login_data)
token = response.json()['access']

# Lister les biens
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:8000/api/biens/', headers=headers)
biens = response.json()
```
