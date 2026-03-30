// ==============================
// Enums
// ==============================

export type TypeBien = "Appartement" | "Maison" | "Local commercial" | "Studio" | "Villa"
export type StatutBien = "Disponible" | "Loué" | "En maintenance"
export type StatutContrat = "Actif" | "Terminé" | "Résilié"
export type StatutPaiement = "Payé" | "En attente" | "Partiel" | "En retard"
export type TypePaiement = "Espèces" | "Virement" | "Mobile Money" | "Chèque"
export type CategorieDepense = "Maintenance" | "Taxes" | "Assurance" | "Travaux" | "Charges" | "Autre"
export type RoleUtilisateur = "Administrateur" | "Gestionnaire" | "Comptable"
export type TypeNotification = "paiement_retard" | "echeance_proche" | "contrat_expiration" | "maintenance_requise" | "nouveau_paiement" | "nouveau_contrat" | "document_ajoute" | "systeme" | "autre"
export type PrioriteNotification = "faible" | "normale" | "haute" | "urgente"
export type TypeDocument = "contrat" | "quittance" | "facture" | "recu" | "piece_identite" | "justificatif" | "photo" | "autre"

// ==============================
// Entities
// ==============================

export interface Bien {
  id: string
  nom: string
  type: TypeBien
  adresse: string
  ville: string
  superficie: number // m²
  nbPieces: number
  prixLocation: number // mensuel
  statut: StatutBien
  description: string
  dateAjout: string
  image?: string
  created_by?: string | number | { id: string | number }
}

export interface Client {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  adresse: string
  cin: string // carte d'identité
  dateInscription: string
  notes?: string
  created_by?: string | number | { id: string | number }
}

export interface Contrat {
  id: string
  reference: string
  clientId: string
  bienId: string
  dateDebut: string
  dateFin: string
  montantMensuel: number
  caution: number
  statut: StatutContrat
  dateCreation: string
  created_by?: string | number | { id: string | number }
}

export interface Paiement {
  id: string
  contratId: string
  montant: number
  datePaiement: string
  dateEcheance: string
  moisPaye?: string
  type: TypePaiement
  statut: StatutPaiement
  reference: string
  notes?: string
  created_by?: string | number | { id: string | number }
}

export interface Depense {
  id: string
  bienId: string | null // null = dépense générale
  categorie: CategorieDepense
  description: string
  montant: number
  date: string
  fournisseur?: string
  created_by?: string | number | { id: string | number }
}

export interface Utilisateur {
  id: string
  nom: string
  prenom: string
  email: string
  role: RoleUtilisateur
  avatar?: string
}

// ==============================
// Dashboard KPI
// ==============================

export interface DonneesMensuelles {
  mois: string
  revenus: number
  depenses: number
}
