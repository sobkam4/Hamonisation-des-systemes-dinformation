// API Types for KamGestion ERP

export interface User {
  id: number
  username: string
  email: string
  is_staff: boolean
  first_name?: string
  last_name?: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface Category {
  id: number
  nom: string
  description?: string
  created_at: string
  updated_at?: string
}

export interface Article {
  id: number
  reference: string
  nom: string
  description?: string
  prix_unitaire: string // Decimal as string
  quantite_stock: number
  seuil_alerte: number
  categorie: number | null
  categorie_detail?: Category
  is_low_stock: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: number
  nom: string
  email?: string
  telephone?: string
  adresse?: string
  city?: string
  notes?: string
  piece_jointe_url?: string
  created_at: string
  updated_at: string
}

export type OrderStatus = 'brouillon' | 'confirmee' | 'livree' | 'annulee'

export interface LigneCommande {
  id: number
  commande: number
  article: number
  article_detail?: Article
  quantite: number
  prix_unitaire: string
  sous_total: string
}

export interface Commande {
  id: number
  numero: string
  client: number
  client_detail?: Client
  date_commande: string
  statut: OrderStatus
  montant_total: string
  lignes: LigneCommande[]
  created_at: string
  updated_at: string
}

export type DeliveryStatus = 'en_attente' | 'en_cours' | 'livree' | 'echouee'

export interface Livraison {
  id: number
  commande: number
  /** Numero de commande (API) si commande_detail non charge */
  numero_commande?: string
  commande_detail?: Commande
  date_livraison_prevue: string
  date_livraison_effective?: string
  statut: DeliveryStatus
  adresse_livraison: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Facture {
  id: number
  numero: string
  commande: number
  commande_detail?: Commande
  date_emission: string
  date_echeance: string
  montant_total: string
  est_payee: boolean
  pdf_url?: string
  created_at: string
  updated_at: string
}

export type MovementType = 'entree' | 'sortie' | 'ajustement'

export interface MouvementStock {
  id: number
  article: number
  article_detail?: Article
  type_mouvement: MovementType
  quantite: number
  reference?: string
  notes?: string
  created_at: string
}

export interface JournalActivite {
  id: number
  utilisateur: number
  utilisateur_detail?: User
  action: string
  entite: string
  entite_id: string
  description: string
  details?: Record<string, unknown>
  created_at: string
}

// API Response types
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Dashboard statistics
export interface DashboardStats {
  total_articles: number
  total_clients: number
  total_commandes: number
  commandes_en_cours: number
  chiffre_affaires: string
  articles_en_rupture: number
  commandes_recentes: Commande[]
  top_articles: { article: Article; quantite_vendue: number }[]
}

// Form data types
export interface ArticleFormData {
  reference?: string
  nom: string
  description?: string
  prix_unitaire: string
  quantite_stock: number
  seuil_alerte: number
  categorie?: number
}

export interface ClientFormData {
  nom: string
  email?: string
  telephone?: string
  adresse?: string
  pieceJointe?: File | null
}

export interface CommandeFormData {
  client: number
  lignes: {
    article: number
    quantite: number
  }[]
}

export interface LivraisonFormData {
  commande: number
  date_livraison_prevue: string
  adresse_livraison: string
  notes?: string
}
