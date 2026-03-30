"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { apiClient, API_ENDPOINTS, type PaginatedResponse } from "./api"
import type { Bien, Client, Contrat, Paiement, Depense, Utilisateur, Notification, Document } from "./types"
import { toast } from "sonner"

// Types pour les réponses API
interface ApiBien {
  id: number
  nom: string
  type_bien: string
  type_bien_display: string
  adresse: string
  prix_location: number
  statut: string
  statut_display: string
  superficie: number
  nombre_pieces: number
  description: string
  date_creation: string
  est_disponible: boolean
  peut_etre_loue: boolean
  created_by?: number | { id: number }
}

interface ApiClient {
  id: number
  nom: string
  prenom: string
  nom_complet: string
  email: string
  telephone: string
  defaut_paiement: boolean
  nombre_contrats_actifs: number
  date_creation: string
  adresse?: string
  piece_identite?: string
  numero_piece_identite?: string
  notes?: string
  created_by?: number | { id: number }
}

interface ApiContrat {
  id: number
  reference?: string
  numero?: string
  client: number
  bien: number
  date_debut: string
  date_fin: string
  montant_mensuel: number
  caution: number
  statut: string
  statut_display?: string
  date_creation: string
  created_by?: number | { id: number }
}

interface ApiPaiement {
  id: number
  contrat: number
  montant: number
  date_paiement: string
  date_echeance: string
  mois_paye?: string
  type_paiement: string
  statut: string
  reference: string
  notes?: string
  created_by?: number | { id: number }
}

interface ApiDepense {
  id: number
  bien: number | null
  categorie: string
  description: string
  montant: number
  date: string
  fournisseur?: string
  created_by?: number | { id: number }
}

interface ApiUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  telephone?: string
}

interface ApiNotification {
  id: number
  type_notification: string
  type_notification_display: string
  titre: string
  message: string
  priorite: string
  priorite_display: string
  lu: boolean
  date_creation: string
  date_lecture?: string
  bien_id?: number
  client_id?: number
  contrat_id?: number
  paiement_id?: number
  metadata?: Record<string, any>
}

interface ApiDocument {
  id: number
  type_document: string
  type_document_display: string
  titre: string
  description?: string
  fichier: string
  fichier_url: string
  taille_fichier?: number
  bien?: number
  client?: number
  contrat?: number
  paiement?: number
  created_by?: number | { id: number }
  date_creation: string
  date_modification: string
}

// Contexte API
interface ApiContextType {
  // Données
  biens: Bien[]
  clients: Client[]
  contrats: Contrat[]
  paiements: Paiement[]
  depenses: Depense[]
  notifications: Notification[]
  documents: Document[]
  utilisateurActuel: Utilisateur | null
  
  // États de chargement
  loading: {
    biens: boolean
    clients: boolean
    contrats: boolean
    paiements: boolean
    depenses: boolean
    notifications: boolean
    documents: boolean
    user: boolean
  }
  
  // Fonctions de chargement
  loadBiens: () => Promise<void>
  loadClients: () => Promise<void>
  loadContrats: () => Promise<void>
  loadPaiements: () => Promise<void>
  loadDepenses: () => Promise<void>
  loadNotifications: () => Promise<void>
  loadDocuments: () => Promise<void>
  loadUser: () => Promise<void>
  refreshAll: () => Promise<void>
  loadAll: () => Promise<void>  // Alias pour refreshAll
  
  // Fonctions CRUD
  createBien: (data: Partial<Bien>) => Promise<Bien | null>
  updateBien: (id: string, data: Partial<Bien>) => Promise<Bien | null>
  deleteBien: (id: string) => Promise<boolean>
  
  createClient: (data: Partial<Client>) => Promise<Client | null>
  updateClient: (id: string, data: Partial<Client>) => Promise<Client | null>
  deleteClient: (id: string) => Promise<boolean>
  
  createContrat: (data: Partial<Contrat>) => Promise<Contrat | null>
  updateContrat: (id: string, data: Partial<Contrat>) => Promise<Contrat | null>
  deleteContrat: (id: string) => Promise<boolean>
  
  createPaiement: (data: Partial<Paiement>) => Promise<Paiement | null>
  updatePaiement: (id: string, data: Partial<Paiement>) => Promise<Paiement | null>
  deletePaiement: (id: string) => Promise<boolean>
  
  createDepense: (data: Partial<Depense>) => Promise<Depense | null>
  updateDepense: (id: string, data: Partial<Depense>) => Promise<Depense | null>
  deleteDepense: (id: string) => Promise<boolean>
  
  // Notifications
  marquerNotificationLue: (id: string) => Promise<boolean>
  marquerToutesNotificationsLues: () => Promise<void>
  supprimerNotificationsLues: () => Promise<void>
  getNombreNotificationsNonLues: () => Promise<number>
  
  // Documents
  createDocument: (data: Partial<Document>, file: File) => Promise<Document | null>
  deleteDocument: (id: string) => Promise<boolean>
  genererPdfContrat: (contratId: string) => Promise<void>
  genererPdfQuittance: (paiementId: string) => Promise<void>
  genererPdfRecu: (paiementId: string) => Promise<void>
  
  // Helpers
  getBien: (id: string) => Bien | undefined
  getClient: (id: string) => Client | undefined
  getContrat: (id: string) => Contrat | undefined
  getContratsForBien: (bienId: string) => Contrat[]
  getContratsForClient: (clientId: string) => Contrat[]
  getPaiementsForContrat: (contratId: string) => Paiement[]
  getDepensesForBien: (bienId: string) => Depense[]
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

// Fonctions de conversion API -> Types frontend
function convertBien(api: ApiBien): Bien {
  return {
    id: String(api.id),
    nom: api.nom,
    type: api.type_bien_display as any,
    adresse: api.adresse,
    ville: api.adresse.split(',').pop()?.trim() || '',
    superficie: api.superficie,
    nbPieces: api.nombre_pieces,
    prixLocation: api.prix_location,
    statut: api.statut_display as any,
    description: api.description || '',
    dateAjout: api.date_creation.split('T')[0],
    created_by: api.created_by,
  }
}

function convertClient(api: ApiClient): Client {
  return {
    id: String(api.id),
    nom: api.nom,
    prenom: api.prenom,
    email: api.email,
    telephone: api.telephone,
    adresse: api.adresse || '',
    cin: api.numero_piece_identite || '',
    dateInscription: api.date_creation.split('T')[0],
    notes: api.notes,
    created_by: api.created_by,
  }
}

function convertContrat(api: ApiContrat): Contrat & { statut_display?: string } {
  return {
    id: String(api.id),
    reference: api.reference || api.numero || `CTR-${api.id}`,
    clientId: String(api.client),
    bienId: String(api.bien),
    dateDebut: api.date_debut.split('T')[0],
    dateFin: api.date_fin.split('T')[0],
    montantMensuel: api.montant_mensuel,
    caution: api.caution,
    statut: api.statut as any,
    statut_display: api.statut_display, // Ajouter statut_display pour le filtrage
    dateCreation: api.date_creation.split('T')[0],
    created_by: api.created_by,
  }
}

function convertPaiement(api: ApiPaiement): Paiement {
  return {
    id: String(api.id),
    contratId: String(api.contrat),
    montant: api.montant,
    datePaiement: api.date_paiement.split('T')[0],
    dateEcheance: api.date_echeance.split('T')[0],
    moisPaye: api.mois_paye,
    type: api.type_paiement as any,
    statut: api.statut as any,
    reference: api.reference,
    notes: api.notes,
    created_by: api.created_by,
  }
}

function convertDepense(api: ApiDepense): Depense {
  return {
    id: String(api.id),
    bienId: api.bien ? String(api.bien) : null,
    categorie: api.categorie as any,
    description: api.description,
    montant: api.montant,
    date: api.date.split('T')[0],
    fournisseur: api.fournisseur,
    created_by: api.created_by,
  }
}

function convertNotification(api: ApiNotification): Notification {
  return {
    id: String(api.id),
    typeNotification: api.type_notification as any,
    titre: api.titre,
    message: api.message,
    priorite: api.priorite as any,
    lu: api.lu,
    dateCreation: api.date_creation,
    dateLecture: api.date_lecture,
    bienId: api.bien_id,
    clientId: api.client_id,
    contratId: api.contrat_id,
    paiementId: api.paiement_id,
    metadata: api.metadata,
  }
}

function convertDocument(api: ApiDocument): Document {
  return {
    id: String(api.id),
    typeDocument: api.type_document as any,
    titre: api.titre,
    description: api.description,
    fichierUrl: api.fichier_url,
    tailleFichier: api.taille_fichier,
    bienId: api.bien ? String(api.bien) : undefined,
    clientId: api.client ? String(api.client) : undefined,
    contratId: api.contrat ? String(api.contrat) : undefined,
    paiementId: api.paiement ? String(api.paiement) : undefined,
    createdBy: api.created_by,
    dateCreation: api.date_creation,
    dateModification: api.date_modification,
  }
}

// Helper pour vérifier si une erreur est silencieuse (redirection en cours ou erreur réseau lors de vérification auth)
const isSilentError = (error: any): boolean => {
  return error?.silent || 
         error?.isRedirecting || 
         (error?.message && (
           error.message.includes('Redirection en cours') ||
           error.message.includes('Session expirée') ||
           (error.isNetworkError && error.message.includes('Serveur non disponible'))
         ))
}

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [biens, setBiens] = useState<Bien[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [utilisateurActuel, setUtilisateurActuel] = useState<Utilisateur | null>(null)
  
  const [loading, setLoading] = useState({
    biens: false,
    clients: false,
    contrats: false,
    paiements: false,
    depenses: false,
    notifications: false,
    documents: false,
    user: false,
  })

  // Charger les biens
  const loadBiens = useCallback(async () => {
    setLoading(prev => ({ ...prev, biens: true }))
    try {
      const response = await apiClient.get<PaginatedResponse<ApiBien>>(API_ENDPOINTS.BIENS.LIST)
      const converted = response.data.results.map(convertBien)
      setBiens(converted)
    } catch (error: any) {
      // Ignorer les erreurs silencieuses (redirections en cours)
      if (isSilentError(error)) {
        return
      }
      console.error('Error loading biens:', error)
      toast.error('Erreur lors du chargement des biens')
    } finally {
      setLoading(prev => ({ ...prev, biens: false }))
    }
  }, [])

  // Charger les clients
  const loadClients = useCallback(async () => {
    setLoading(prev => ({ ...prev, clients: true }))
    try {
      const response = await apiClient.get<PaginatedResponse<ApiClient>>(API_ENDPOINTS.CLIENTS.LIST)
      const converted = response.data.results.map(convertClient)
      setClients(converted)
    } catch (error: any) {
      if (isSilentError(error)) return
      console.error('Error loading clients:', error)
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(prev => ({ ...prev, clients: false }))
    }
  }, [])

  // Charger les contrats
  const loadContrats = useCallback(async () => {
    setLoading(prev => ({ ...prev, contrats: true }))
    try {
      const response = await apiClient.get<PaginatedResponse<ApiContrat>>(API_ENDPOINTS.CONTRATS.LIST)
      const converted = response.data.results.map(convertContrat)
      setContrats(converted)
    } catch (error: any) {
      if (isSilentError(error)) return
      console.error('Error loading contrats:', error)
      toast.error('Erreur lors du chargement des contrats')
    } finally {
      setLoading(prev => ({ ...prev, contrats: false }))
    }
  }, [])

  // Charger les paiements
  const loadPaiements = useCallback(async () => {
    setLoading(prev => ({ ...prev, paiements: true }))
    try {
      const response = await apiClient.get<PaginatedResponse<ApiPaiement>>(API_ENDPOINTS.PAIEMENTS.LIST)
      const converted = response.data.results.map(convertPaiement)
      setPaiements(converted)
    } catch (error: any) {
      if (isSilentError(error)) return
      console.error('Error loading paiements:', error)
      toast.error('Erreur lors du chargement des paiements')
    } finally {
      setLoading(prev => ({ ...prev, paiements: false }))
    }
  }, [])

  // Charger les dépenses
  const loadDepenses = useCallback(async () => {
    setLoading(prev => ({ ...prev, depenses: true }))
    try {
      const response = await apiClient.get<PaginatedResponse<ApiDepense>>(API_ENDPOINTS.DEPENSES.LIST)
      const converted = response.data.results.map(convertDepense)
      setDepenses(converted)
    } catch (error: any) {
      if (isSilentError(error)) return
      console.error('Error loading depenses:', error)
      toast.error('Erreur lors du chargement des dépenses')
    } finally {
      setLoading(prev => ({ ...prev, depenses: false }))
    }
  }, [])

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    setLoading(prev => ({ ...prev, notifications: true }))
    try {
      const response = await apiClient.get<PaginatedResponse<ApiNotification>>(API_ENDPOINTS.NOTIFICATIONS.LIST)
      const converted = response.data.results.map(convertNotification)
      setNotifications(converted)
    } catch (error: any) {
      if (isSilentError(error)) return
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }))
    }
  }, [])

  // Charger les documents
  const loadDocuments = useCallback(async () => {
    setLoading(prev => ({ ...prev, documents: true }))
    try {
      const response = await apiClient.get<PaginatedResponse<ApiDocument>>(API_ENDPOINTS.DOCUMENTS.LIST)
      const converted = response.data.results.map(convertDocument)
      setDocuments(converted)
    } catch (error: any) {
      if (isSilentError(error)) return
      console.error('Error loading documents:', error)
    } finally {
      setLoading(prev => ({ ...prev, documents: false }))
    }
  }, [])

  // Charger l'utilisateur actuel
  const loadUser = useCallback(async () => {
    setLoading(prev => ({ ...prev, user: true }))
    try {
      const response = await apiClient.get<ApiUser>(API_ENDPOINTS.AUTH.PROFILE)
      setUtilisateurActuel({
        id: String(response.data.id),
        nom: response.data.last_name,
        prenom: response.data.first_name,
        email: response.data.email,
        role: response.data.role === 'admin' ? 'Administrateur' : 
              response.data.role === 'gestionnaire' ? 'Gestionnaire' : 'Comptable',
      })
    } catch (error: any) {
      if (isSilentError(error)) return
      console.error('Error loading user:', error)
    } finally {
      setLoading(prev => ({ ...prev, user: false }))
    }
  }, [])

  // Rafraîchir toutes les données
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadBiens(),
      loadClients(),
      loadContrats(),
      loadPaiements(),
      loadDepenses(),
      loadNotifications(),
      loadDocuments(),
      loadUser(),
    ])
  }, [loadBiens, loadClients, loadContrats, loadPaiements, loadDepenses, loadNotifications, loadDocuments, loadUser])
  
  // Alias pour compatibilité
  const loadAll = refreshAll

  // Charger les données au montage
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      refreshAll()
    }
  }, [refreshAll])

  // Fonctions CRUD - Biens
  const createBien = async (data: Partial<Bien>): Promise<Bien | null> => {
    try {
      // Convertir les données du format frontend vers le format API
      const apiData: any = {
        nom: data.nom,
        type_bien: data.type?.toLowerCase().replace(' ', '_') || 'appartement',
        adresse: data.adresse,
        prix_location: data.prixLocation || 0,
        statut: data.statut?.toLowerCase().replace(' ', '_') || 'disponible',
        superficie: data.superficie || 0,
        nombre_pieces: data.nbPieces || 1,
        description: data.description || '',
      }
      
      const response = await apiClient.post<ApiBien>(API_ENDPOINTS.BIENS.LIST, apiData)
      const converted = convertBien(response.data)
      setBiens(prev => [...prev, converted])
      toast.success('Bien créé avec succès')
      return converted
    } catch (error: any) {
      console.error('Error creating bien:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de la création du bien'
      toast.error(errorMessage)
      return null
    }
  }

  const updateBien = async (id: string, data: Partial<Bien>): Promise<Bien | null> => {
    try {
      const response = await apiClient.patch<ApiBien>(API_ENDPOINTS.BIENS.DETAIL(Number(id)), data)
      const converted = convertBien(response.data)
      setBiens(prev => prev.map(b => b.id === id ? converted : b))
      toast.success('Bien mis à jour')
      return converted
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour du bien')
      return null
    }
  }

  // Helper pour extraire les messages d'erreur de suppression
  const getDeleteErrorMessage = (error: any, defaultMessage: string, entityName: string): string => {
    if (error?.response?.data) {
      const data = error.response.data
      let errorMessage = data.detail || data.message || (typeof data === 'string' ? data : defaultMessage)
      
      // Si c'est une erreur ProtectedError, afficher un message plus clair
      if (errorMessage.includes('protected foreign keys') || errorMessage.includes('referenced through')) {
        if (entityName === 'bien') {
          errorMessage = "Impossible de supprimer ce bien car il est associé à un ou plusieurs contrats. Veuillez d'abord supprimer ou modifier les contrats associés."
        } else if (entityName === 'client') {
          errorMessage = "Impossible de supprimer ce client car il est associé à un ou plusieurs contrats. Veuillez d'abord supprimer ou modifier les contrats associés."
        } else if (entityName === 'contrat') {
          errorMessage = "Impossible de supprimer ce contrat car il est associé à des paiements. Veuillez d'abord supprimer les paiements associés."
        } else {
          errorMessage = `Impossible de supprimer cet élément car il est référencé par d'autres données.`
        }
      }
      return errorMessage
    }
    return defaultMessage
  }

  const deleteBien = async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(API_ENDPOINTS.BIENS.DETAIL(Number(id)))
      setBiens(prev => prev.filter(b => b.id !== id))
      toast.success('Bien supprimé')
      return true
    } catch (error: any) {
      const errorMessage = getDeleteErrorMessage(error, 'Erreur lors de la suppression du bien', 'bien')
      toast.error(errorMessage)
      return false
    }
  }

  // Fonctions CRUD - Clients
  const createClient = async (data: Partial<Client>): Promise<Client | null> => {
    try {
      const response = await apiClient.post<ApiClient>(API_ENDPOINTS.CLIENTS.LIST, data)
      const converted = convertClient(response.data)
      setClients(prev => [...prev, converted])
      toast.success('Client créé avec succès')
      return converted
    } catch (error: any) {
      toast.error('Erreur lors de la création du client')
      return null
    }
  }

  const updateClient = async (id: string, data: Partial<Client>): Promise<Client | null> => {
    try {
      const response = await apiClient.patch<ApiClient>(API_ENDPOINTS.CLIENTS.DETAIL(Number(id)), data)
      const converted = convertClient(response.data)
      setClients(prev => prev.map(c => c.id === id ? converted : c))
      toast.success('Client mis à jour')
      return converted
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour du client')
      return null
    }
  }

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(API_ENDPOINTS.CLIENTS.DETAIL(Number(id)))
      setClients(prev => prev.filter(c => c.id !== id))
      toast.success('Client supprimé')
      return true
    } catch (error: any) {
      const errorMessage = getDeleteErrorMessage(error, 'Erreur lors de la suppression du client', 'client')
      toast.error(errorMessage)
      return false
    }
  }

  // Fonctions CRUD - Contrats
  const createContrat = async (data: Partial<Contrat> | any): Promise<Contrat | null> => {
    try {
      // Convertir les données du format frontend vers le format API
      const clientId = Number(data.client || data.clientId)
      const bienId = Number(data.bien || data.bienId)
      
      // Validation des champs requis
      if (!clientId || isNaN(clientId)) {
        toast.error('Client invalide')
        return null
      }
      if (!bienId || isNaN(bienId)) {
        toast.error('Bien invalide')
        return null
      }
      
      const apiData: any = {
        client: clientId,
        bien: bienId,
        date_debut: data.date_debut || data.dateDebut,
        date_fin: data.date_fin || data.dateFin,
        montant_mensuel: Number(data.montant_mensuel || data.montantMensuel || 0),
        caution: Number(data.caution || 0),
      }
      
      console.log('Creating contrat with data:', apiData) // Debug
      
      const response = await apiClient.post<ApiContrat>(API_ENDPOINTS.CONTRATS.LIST, apiData)
      const converted = convertContrat(response.data)
      setContrats(prev => [...prev, converted])
      // Recharger les contrats pour avoir les statuts à jour (calculés automatiquement par le backend)
      await loadContrats()
      // Recharger aussi les biens car leur statut peut avoir changé
      await loadBiens()
      toast.success('Contrat créé avec succès')
      return converted
    } catch (error: any) {
      console.error('Error creating contrat:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de la création du contrat'
      toast.error(errorMessage)
      return null
    }
  }

  const updateContrat = async (id: string, data: Partial<Contrat>): Promise<Contrat | null> => {
    try {
      const response = await apiClient.patch<ApiContrat>(API_ENDPOINTS.CONTRATS.DETAIL(Number(id)), {
        client: data.clientId ? Number(data.clientId) : undefined,
        bien: data.bienId ? Number(data.bienId) : undefined,
        date_debut: data.dateDebut,
        date_fin: data.dateFin,
        montant_mensuel: data.montantMensuel,
        caution: data.caution,
        statut: data.statut,
      })
      const converted = convertContrat(response.data)
      setContrats(prev => prev.map(c => c.id === id ? converted : c))
      // Recharger les contrats pour avoir les statuts à jour (calculés automatiquement par le backend)
      await loadContrats()
      // Recharger aussi les biens car leur statut peut avoir changé
      await loadBiens()
      toast.success('Contrat mis à jour')
      return converted
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour du contrat')
      return null
    }
  }

  const deleteContrat = async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(API_ENDPOINTS.CONTRATS.DETAIL(Number(id)))
      setContrats(prev => prev.filter(c => c.id !== id))
      toast.success('Contrat supprimé')
      return true
    } catch (error: any) {
      const errorMessage = getDeleteErrorMessage(error, 'Erreur lors de la suppression du contrat', 'contrat')
      toast.error(errorMessage)
      return false
    }
  }

  // Fonctions CRUD - Paiements
  const createPaiement = async (data: Partial<Paiement> | any): Promise<Paiement | null> => {
    try {
      // Mapper le type_paiement du format frontend vers le format backend
      const typePaiementMap: Record<string, string> = {
        'Espèces': 'especes',
        'Virement': 'virement',
        'Mobile Money': 'mobile_money',
        'Chèque': 'cheque',
      }
      
      const apiData: any = {
        contrat: Number(data.contrat || data.contratId),
        montant: Number(data.montant || 0),
        date_paiement: data.date_paiement || data.datePaiement,
        date_echeance: data.date_echeance || data.dateEcheance,
        mois_paye: data.moisPaye || data.mois_paye,
        type_paiement: typePaiementMap[data.type_paiement || data.type] || (data.type_paiement || data.type || 'especes').toLowerCase().replace(' ', '_'),
        notes: data.notes || undefined,
      }
      
      // Validation basique
      if (!apiData.contrat || !apiData.montant || !apiData.date_paiement || !apiData.date_echeance) {
        throw new Error("Veuillez remplir tous les champs obligatoires pour le paiement.")
      }
      
      const response = await apiClient.post<ApiPaiement>(API_ENDPOINTS.PAIEMENTS.LIST, apiData)
      const converted = convertPaiement(response.data)
      setPaiements(prev => [...prev, converted])
      // Rafraîchir les paiements et contrats pour mettre à jour les statuts
      await loadPaiements()
      await loadContrats()
      toast.success('Paiement créé avec succès')
      return converted
    } catch (error: any) {
      toast.error('Erreur lors de la création du paiement')
      return null
    }
  }

  const updatePaiement = async (id: string, data: Partial<Paiement>): Promise<Paiement | null> => {
    try {
      // Mapper le type_paiement du format frontend vers le format backend
      const typePaiementMap: Record<string, string> = {
        'Espèces': 'especes',
        'Virement': 'virement',
        'Mobile Money': 'mobile_money',
        'Chèque': 'cheque',
      }
      
      const response = await apiClient.patch<ApiPaiement>(API_ENDPOINTS.PAIEMENTS.DETAIL(Number(id)), {
        montant: data.montant,
        date_paiement: data.datePaiement || data.date_paiement,
        date_echeance: data.dateEcheance || data.date_echeance,
        mois_paye: data.moisPaye || data.mois_paye,
        type_paiement: typePaiementMap[data.type_paiement || data.type || ''] || (data.type_paiement || data.type || 'especes').toLowerCase().replace(/\s+/g, '_'),
        statut: data.statut,
        notes: data.notes,
      })
      const converted = convertPaiement(response.data)
      setPaiements(prev => prev.map(p => p.id === id ? converted : p))
      // Rafraîchir les paiements et contrats pour mettre à jour les statuts
      await loadPaiements()
      await loadContrats()
      toast.success('Paiement mis à jour')
      return converted
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour du paiement')
      return null
    }
  }

  const deletePaiement = async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(API_ENDPOINTS.PAIEMENTS.DETAIL(Number(id)))
      setPaiements(prev => prev.filter(p => p.id !== id))
      // Rafraîchir les paiements et contrats pour mettre à jour les statuts
      await loadPaiements()
      await loadContrats()
      toast.success('Paiement supprimé')
      return true
    } catch (error: any) {
      const errorMessage = getDeleteErrorMessage(error, 'Erreur lors de la suppression du paiement', 'paiement')
      toast.error(errorMessage)
      return false
    }
  }

  // Fonctions CRUD - Dépenses
  const createDepense = async (data: Partial<Depense>): Promise<Depense | null> => {
    try {
      const response = await apiClient.post<ApiDepense>(API_ENDPOINTS.DEPENSES.LIST, {
        bien: data.bienId ? Number(data.bienId) : null,
        categorie: data.categorie,
        description: data.description,
        montant: data.montant,
        date: data.date,
        fournisseur: data.fournisseur,
      })
      const converted = convertDepense(response.data)
      setDepenses(prev => [...prev, converted])
      toast.success('Dépense créée avec succès')
      return converted
    } catch (error: any) {
      toast.error('Erreur lors de la création de la dépense')
      return null
    }
  }

  const updateDepense = async (id: string, data: Partial<Depense>): Promise<Depense | null> => {
    try {
      const response = await apiClient.patch<ApiDepense>(API_ENDPOINTS.DEPENSES.DETAIL(Number(id)), {
        bien: data.bienId ? Number(data.bienId) : null,
        categorie: data.categorie,
        description: data.description,
        montant: data.montant,
        date: data.date,
        fournisseur: data.fournisseur,
      })
      const converted = convertDepense(response.data)
      setDepenses(prev => prev.map(d => d.id === id ? converted : d))
      toast.success('Dépense mise à jour')
      return converted
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour de la dépense')
      return null
    }
  }

  const deleteDepense = async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(API_ENDPOINTS.DEPENSES.DETAIL(Number(id)))
      setDepenses(prev => prev.filter(d => d.id !== id))
      toast.success('Dépense supprimée')
      return true
    } catch (error: any) {
      const errorMessage = getDeleteErrorMessage(error, 'Erreur lors de la suppression de la dépense', 'depense')
      toast.error(errorMessage)
      return false
    }
  }

  // Helpers
  const getBien = (id: string) => biens.find(b => b.id === id)
  const getClient = (id: string) => clients.find(c => c.id === id)
  const getContrat = (id: string) => contrats.find(c => c.id === id)
  const getContratsForBien = (bienId: string) => contrats.filter(c => c.bienId === bienId)
  const getContratsForClient = (clientId: string) => contrats.filter(c => c.clientId === clientId)
  const getPaiementsForContrat = (contratId: string) => paiements.filter(p => p.contratId === contratId)
  const getDepensesForBien = (bienId: string) => depenses.filter(d => d.bienId === bienId)

  // Notifications
  const marquerNotificationLue = async (id: string): Promise<boolean> => {
    try {
      await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.DETAIL(Number(id)), { lu: true })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
      return true
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  const marquerToutesNotificationsLues = async (): Promise<void> => {
    try {
      await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARQUER_TOUTES_LUES)
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const supprimerNotificationsLues = async (): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.SUPPRIMER_LUES)
      setNotifications(prev => prev.filter(n => !n.lu))
    } catch (error: any) {
      console.error('Error deleting read notifications:', error)
    }
  }

  const getNombreNotificationsNonLues = async (): Promise<number> => {
    try {
      const response = await apiClient.get<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.NOMBRE_NON_LUES)
      return response.data.count
    } catch (error: any) {
      console.error('Error getting unread notifications count:', error)
      return 0
    }
  }

  // Documents
  const createDocument = async (data: Partial<Document>, file: File): Promise<Document | null> => {
    try {
      const formData = new FormData()
      formData.append('fichier', file)
      formData.append('type_document', data.typeDocument || 'autre')
      formData.append('titre', data.titre || '')
      if (data.description) formData.append('description', data.description)
      if (data.bienId) formData.append('bien', data.bienId)
      if (data.clientId) formData.append('client', data.clientId)
      if (data.contratId) formData.append('contrat', data.contratId)
      if (data.paiementId) formData.append('paiement', data.paiementId)

      const response = await apiClient.upload<ApiDocument>(API_ENDPOINTS.DOCUMENTS.LIST, formData)
      const converted = convertDocument(response.data)
      setDocuments(prev => [...prev, converted])
      toast.success('Document ajouté avec succès')
      return converted
    } catch (error: any) {
      toast.error('Erreur lors de l\'ajout du document')
      return null
    }
  }

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(API_ENDPOINTS.DOCUMENTS.DETAIL(Number(id)))
      setDocuments(prev => prev.filter(d => d.id !== id))
      toast.success('Document supprimé')
      return true
    } catch (error: any) {
      toast.error('Erreur lors de la suppression du document')
      return false
    }
  }

  const genererPdfContrat = async (contratId: string): Promise<void> => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${API_ENDPOINTS.DOCUMENTS.PDF_CONTRAT(Number(contratId))}`
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('Erreur lors de la génération du PDF')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `contrat_${contratId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.success('PDF généré avec succès')
    } catch (error: any) {
      toast.error('Erreur lors de la génération du PDF')
    }
  }

  const genererPdfQuittance = async (paiementId: string): Promise<void> => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${API_ENDPOINTS.DOCUMENTS.PDF_QUITTANCE(Number(paiementId))}`
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('Erreur lors de la génération du PDF')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `quittance_${paiementId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.success('PDF généré avec succès')
    } catch (error: any) {
      toast.error('Erreur lors de la génération du PDF')
    }
  }

  const genererPdfRecu = async (paiementId: string): Promise<void> => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${API_ENDPOINTS.DOCUMENTS.PDF_RECU(Number(paiementId))}`
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('Erreur lors de la génération du PDF')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `recu_${paiementId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.success('PDF généré avec succès')
    } catch (error: any) {
      toast.error('Erreur lors de la génération du PDF')
    }
  }

  return (
    <ApiContext.Provider
      value={{
        biens,
        clients,
        contrats,
        paiements,
        depenses,
        notifications,
        documents,
        utilisateurActuel,
        loading,
        loadBiens,
        loadClients,
        loadContrats,
        loadPaiements,
        loadDepenses,
        loadNotifications,
        loadDocuments,
        loadUser,
        refreshAll,
        loadAll,
        createBien,
        updateBien,
        deleteBien,
        createClient,
        updateClient,
        deleteClient,
        createContrat,
        updateContrat,
        deleteContrat,
        createPaiement,
        updatePaiement,
        deletePaiement,
        createDepense,
        updateDepense,
        deleteDepense,
        marquerNotificationLue,
        marquerToutesNotificationsLues,
        supprimerNotificationsLues,
        getNombreNotificationsNonLues,
        createDocument,
        deleteDocument,
        genererPdfContrat,
        genererPdfQuittance,
        genererPdfRecu,
        getBien,
        getClient,
        getContrat,
        getContratsForBien,
        getContratsForClient,
        getPaiementsForContrat,
        getDepensesForBien,
      }}
    >
      {children}
    </ApiContext.Provider>
  )
}

export function useApiData() {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error("useApiData must be used within an ApiProvider")
  }
  return context
}
