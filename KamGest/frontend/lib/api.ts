// API Client for the Django backend

import type {
  User,
  AuthTokens,
  Category,
  Article,
  Client,
  Commande,
  Livraison,
  Facture,
  MouvementStock,
  JournalActivite,
  PaginatedResponse,
  DashboardStats,
  ArticleFormData,
  ClientFormData,
  CommandeFormData,
  LivraisonFormData,
  OrderStatus,
  DeliveryStatus,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function formatDjangoErrorBody(data: unknown): string {
  if (data === null || data === undefined) return 'Requete invalide'
  if (typeof data === 'string') return data
  if (typeof data !== 'object') return 'Requete invalide'

  const d = data as Record<string, unknown>
  if (typeof d.detail === 'string') return d.detail
  if (Array.isArray(d.detail)) {
    return d.detail.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(', ')
  }

  const parts: string[] = []
  for (const [key, value] of Object.entries(d)) {
    if (key === 'detail') continue
    if (Array.isArray(value)) {
      const msgs = value.map((v) =>
        typeof v === 'string' ? v : v && typeof v === 'object' && 'string' in v ? String((v as { string: string }).string) : JSON.stringify(v)
      )
      parts.push(`${key}: ${msgs.join(', ')}`)
    } else if (value !== null && value !== undefined) {
      parts.push(`${key}: ${String(value)}`)
    }
  }

  return parts.length ? parts.join(' | ') : 'Requete invalide'
}

interface RawLoginResponse {
  user: User
  tokens: AuthTokens
}

interface RawCategory {
  id: number
  name: string
  description?: string
  created_at: string
}

interface RawProduct {
  id: number
  category: number | null
  category_name?: string
  reference: string
  name: string
  description?: string
  sale_price: string
  stock_quantity: number
  low_stock_threshold: number
  is_low_stock: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface RawCustomer {
  id: number
  first_name: string
  last_name: string
  full_name: string
  phone?: string
  email?: string
  address?: string
  city?: string
  notes?: string
  attachment?: string | null
  created_at: string
  updated_at: string
}

interface RawOrderItem {
  id: number
  product: number
  product_reference?: string
  product_name: string
  quantity: number
  unit_price: string
  subtotal: string
}

interface RawOrder {
  id: number
  number: string
  customer: number
  customer_name: string
  status: string
  total: string
  invoice_object_name?: string | null
  invoice_uploaded_at?: string | null
  confirmed_at?: string | null
  created_at: string
  updated_at: string
  items: RawOrderItem[]
}

interface RawDelivery {
  id: number
  order: number
  order_number?: string
  status: string
  address: string
  scheduled_for?: string | null
  delivered_at?: string | null
  notes?: string
  created_at: string
  updated_at: string
}

interface RawStockMovement {
  id: number
  product: number
  product_reference?: string
  product_name?: string
  order_number?: string
  movement_type: string
  quantity: number
  note?: string
  created_at: string
}

interface RawActivityLog {
  id: number
  user: number | null
  username: string
  action: string
  entity_type: string
  entity_id: string | null
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

interface RawDashboardStats {
  products_count: number
  low_stock_count: number
  customers_count: number
  orders_count: number
  revenue_total: string
  sales_today_total: string
  pending_deliveries_count: number
  recent_orders: Array<{
    id: number
    number: string
    customer_name: string
    status: string
    total: string
    created_at: string
  }>
}

let accessToken: string | null = null
let refreshToken: string | null = null

function splitFullName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return { first_name: '', last_name: '' }
  }

  const parts = normalized.split(' ')
  if (parts.length === 1) {
    const only = parts[0]
    // Django Customer exige first_name et last_name non vides
    return { first_name: only, last_name: only }
  }

  return {
    first_name: parts.slice(0, -1).join(' '),
    last_name: parts.at(-1) || '',
  }
}

function mapOrderStatus(status: string): OrderStatus {
  const statusMap: Record<string, OrderStatus> = {
    draft: 'brouillon',
    confirmed: 'confirmee',
    delivered: 'livree',
    cancelled: 'annulee',
  }

  return statusMap[status] || 'brouillon'
}

function mapDeliveryStatus(status: string): DeliveryStatus {
  const statusMap: Record<string, DeliveryStatus> = {
    pending: 'en_attente',
    in_transit: 'en_cours',
    delivered: 'livree',
    cancelled: 'echouee',
  }

  return statusMap[status] || 'en_attente'
}

function mapDeliveryStatusToApi(status: DeliveryStatus): string {
  const statusMap: Record<DeliveryStatus, string> = {
    en_attente: 'pending',
    en_cours: 'in_transit',
    livree: 'delivered',
    echouee: 'cancelled',
  }

  return statusMap[status]
}

function mapMovementType(type: string): 'entree' | 'sortie' | 'ajustement' {
  if (type === 'out') return 'sortie'
  if (type === 'adjustment') return 'ajustement'
  return 'entree'
}

function mapMovementTypeToApi(type: string): string {
  if (type === 'sortie') return 'out'
  if (type === 'ajustement') return 'adjustment'
  return 'in'
}

function mapCategory(raw: RawCategory): Category {
  return {
    id: raw.id,
    nom: raw.name,
    description: raw.description || '',
    created_at: raw.created_at,
  }
}

function mapProduct(raw: RawProduct): Article {
  return {
    id: raw.id,
    reference: raw.reference,
    nom: raw.name,
    description: raw.description || '',
    prix_unitaire: raw.sale_price,
    quantite_stock: raw.stock_quantity,
    seuil_alerte: raw.low_stock_threshold,
    categorie: raw.category,
    categorie_detail: raw.category_name
      ? {
          id: raw.category || 0,
          nom: raw.category_name,
          created_at: '',
        }
      : undefined,
    is_low_stock: raw.is_low_stock,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

function mapCustomer(raw: RawCustomer): Client {
  return {
    id: raw.id,
    nom: raw.full_name,
    email: raw.email || '',
    telephone: raw.phone || '',
    adresse: raw.address || '',
    city: raw.city || '',
    notes: raw.notes || '',
    piece_jointe_url: raw.attachment || undefined,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

function mapOrder(raw: RawOrder): Commande {
  return {
    id: raw.id,
    numero: raw.number,
    client: raw.customer,
    client_detail: {
      id: raw.customer,
      nom: raw.customer_name,
      created_at: '',
      updated_at: '',
    },
    date_commande: raw.created_at,
    statut: mapOrderStatus(raw.status),
    montant_total: raw.total,
    lignes: raw.items.map((item) => ({
      id: item.id,
      commande: raw.id,
      article: item.product,
      article_detail: {
        id: item.product,
        reference: item.product_reference || `ART-${item.product}`,
        nom: item.product_name,
        prix_unitaire: item.unit_price,
        quantite_stock: 0,
        seuil_alerte: 0,
        categorie: null,
        is_low_stock: false,
        created_at: '',
        updated_at: '',
      },
      quantite: item.quantity,
      prix_unitaire: item.unit_price,
      sous_total: item.subtotal,
    })),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

function mapDelivery(raw: RawDelivery, ordersById?: Map<number, Commande>): Livraison {
  return {
    id: raw.id,
    commande: raw.order,
    numero_commande: raw.order_number,
    commande_detail: ordersById?.get(raw.order),
    date_livraison_prevue: raw.scheduled_for || raw.created_at,
    date_livraison_effective: raw.delivered_at || undefined,
    statut: mapDeliveryStatus(raw.status),
    adresse_livraison: raw.address,
    notes: raw.notes || '',
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

function mapActivityLog(raw: RawActivityLog): JournalActivite {
  const uid = raw.user ?? 0
  return {
    id: raw.id,
    utilisateur: uid,
    utilisateur_detail: {
      id: uid,
      username: raw.username === '-' ? '—' : raw.username,
      email: '',
      is_staff: false,
    },
    action: raw.action,
    entite: raw.entity_type,
    entite_id: raw.entity_id ?? '',
    description: raw.description,
    details: raw.metadata,
    created_at: raw.created_at,
  }
}

function mapStockMovement(raw: RawStockMovement): MouvementStock {
  return {
    id: raw.id,
    article: raw.product,
    article_detail: {
      id: raw.product,
      reference: raw.product_reference || `ART-${raw.product}`,
      nom: raw.product_name || `Article #${raw.product}`,
      prix_unitaire: '0',
      quantite_stock: 0,
      seuil_alerte: 0,
      categorie: null,
      is_low_stock: false,
      created_at: '',
      updated_at: '',
    },
    type_mouvement: mapMovementType(raw.movement_type),
    quantite: raw.movement_type === 'adjustment' ? raw.quantity : Math.abs(raw.quantity),
    reference: raw.order_number,
    notes: raw.note || '',
    created_at: raw.created_at,
  }
}

function addDays(date: string, days: number): string {
  const baseDate = new Date(date)
  baseDate.setDate(baseDate.getDate() + days)
  return baseDate.toISOString()
}

function mapFacture(raw: RawOrder): Facture {
  const issueDate = raw.confirmed_at || raw.created_at
  return {
    id: raw.id,
    numero: `FAC-${raw.number.replace(/^CMD-/, '')}`,
    commande: raw.id,
    commande_detail: mapOrder(raw),
    date_emission: issueDate,
    date_echeance: addDays(issueDate, 30),
    montant_total: raw.total,
    est_payee: false,
    pdf_url: raw.invoice_object_name || undefined,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

function normalizeListResponse<T>(data: T[] | PaginatedResponse<T>): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
    }
  }

  return data
}

export function setTokens(tokens: AuthTokens) {
  accessToken = tokens.access
  refreshToken = tokens.refresh
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
  }
}

export function getTokens(): AuthTokens | null {
  if (typeof window !== 'undefined') {
    const access = localStorage.getItem('access_token')
    const refresh = localStorage.getItem('refresh_token')
    if (access && refresh) {
      accessToken = access
      refreshToken = refresh
      return { access, refresh }
    }
  }

  return accessToken && refreshToken ? { access: accessToken, refresh: refreshToken } : null
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens()
  if (!tokens?.refresh) return null

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    })

    if (response.ok) {
      const data = await response.json()
      accessToken = data.access
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access)
      }
      return data.access
    }
  } catch {
    // Ignore and clear tokens below.
  }

  clearTokens()
  return null
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const tokens = getTokens()
  if (requiresAuth && tokens?.access) {
    headers.set('Authorization', `Bearer ${tokens.access}`)
  }

  let response = await fetch(url, { ...options, headers })

  if (response.status === 401 && requiresAuth) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(url, { ...options, headers })
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(response.status, formatDjangoErrorBody(errorData), errorData)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

async function postMultipartJson<T>(endpoint: string, formData: FormData): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  const tokens = getTokens()
  const headers = new Headers()
  if (tokens?.access) {
    headers.set('Authorization', `Bearer ${tokens.access}`)
  }

  let response = await fetch(url, { method: 'POST', headers, body: formData })

  if (response.status === 401 && tokens?.refresh) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(url, { method: 'POST', headers, body: formData })
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(response.status, formatDjangoErrorBody(errorData), errorData)
  }

  return response.json() as Promise<T>
}

async function fetchAuthorizedBlob(path: string): Promise<Blob> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const tokens = getTokens()
  const headers: HeadersInit = {}
  if (tokens?.access) {
    headers.Authorization = `Bearer ${tokens.access}`
  }

  let response = await fetch(url, { headers })

  if (response.status === 401 && tokens?.refresh) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${newToken}` },
      })
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(response.status, formatDjangoErrorBody(errorData), errorData)
  }

  return response.blob()
}

export const authApi = {
  login: async (username: string, password: string): Promise<User> => {
    const response = await apiRequest<RawLoginResponse>(
      '/auth/login/',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      },
      false
    )

    setTokens(response.tokens)
    return response.user
  },

  logout: () => {
    clearTokens()
  },

  getCurrentUser: (): Promise<User> => apiRequest<User>('/auth/me/'),

  register: (data: { username: string; email: string; password: string }): Promise<User> =>
    apiRequest<User>(
      '/users/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      false
    ),
}

export const categoriesApi = {
  list: async (params?: { search?: string }): Promise<PaginatedResponse<Category>> => {
    const query = params?.search ? `?search=${encodeURIComponent(params.search)}` : ''
    const response = await apiRequest<RawCategory[] | PaginatedResponse<RawCategory>>(`/categories/${query}`)
    const normalized = normalizeListResponse(response)
    return { ...normalized, results: normalized.results.map(mapCategory) }
  },

  get: async (id: number): Promise<Category> => mapCategory(await apiRequest<RawCategory>(`/categories/${id}/`)),

  create: async (data: Partial<Category>): Promise<Category> =>
    mapCategory(
      await apiRequest<RawCategory>('/categories/', {
        method: 'POST',
        body: JSON.stringify({
          name: data.nom,
          description: data.description,
        }),
      })
    ),

  update: async (id: number, data: Partial<Category>): Promise<Category> =>
    mapCategory(
      await apiRequest<RawCategory>(`/categories/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: data.nom,
          description: data.description,
        }),
      })
    ),

  delete: (id: number): Promise<void> => apiRequest<void>(`/categories/${id}/`, { method: 'DELETE' }),
}

export const articlesApi = {
  list: async (params?: {
    search?: string
    categorie?: number
    low_stock?: boolean
    page?: number
  }): Promise<PaginatedResponse<Article>> => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.categorie) searchParams.set('category', params.categorie.toString())
    if (params?.low_stock) searchParams.set('low_stock', '1')
    if (params?.page) searchParams.set('page', params.page.toString())

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    const response = await apiRequest<RawProduct[] | PaginatedResponse<RawProduct>>(`/products/${query}`)
    const normalized = normalizeListResponse(response)
    return { ...normalized, results: normalized.results.map(mapProduct) }
  },

  get: async (id: number): Promise<Article> => mapProduct(await apiRequest<RawProduct>(`/products/${id}/`)),

  create: async (data: ArticleFormData): Promise<Article> => {
    const body: Record<string, unknown> = {
      name: data.nom,
      description: data.description || '',
      sale_price: data.prix_unitaire,
      stock_quantity: data.quantite_stock,
      low_stock_threshold: data.seuil_alerte,
      category: data.categorie || null,
    }
    if (data.reference?.trim()) {
      body.reference = data.reference.trim()
    }
    return mapProduct(
      await apiRequest<RawProduct>('/products/', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    )
  },

  update: async (id: number, data: Partial<ArticleFormData>): Promise<Article> =>
    mapProduct(
      await apiRequest<RawProduct>(`/products/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(data.reference !== undefined ? { reference: data.reference } : {}),
          ...(data.nom !== undefined ? { name: data.nom } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.prix_unitaire !== undefined ? { sale_price: data.prix_unitaire } : {}),
          ...(data.quantite_stock !== undefined ? { stock_quantity: data.quantite_stock } : {}),
          ...(data.seuil_alerte !== undefined ? { low_stock_threshold: data.seuil_alerte } : {}),
          ...(data.categorie !== undefined ? { category: data.categorie } : {}),
        }),
      })
    ),

  delete: (id: number): Promise<void> => apiRequest<void>(`/products/${id}/`, { method: 'DELETE' }),

  getLowStock: async (): Promise<Article[]> => {
    const response = await articlesApi.list({ low_stock: true })
    return response.results
  },
}

export const clientsApi = {
  list: async (params?: { search?: string; page?: number }): Promise<PaginatedResponse<Client>> => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', params.page.toString())

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    const response = await apiRequest<RawCustomer[] | PaginatedResponse<RawCustomer>>(`/customers/${query}`)
    const normalized = normalizeListResponse(response)
    return { ...normalized, results: normalized.results.map(mapCustomer) }
  },

  get: async (id: number): Promise<Client> => mapCustomer(await apiRequest<RawCustomer>(`/customers/${id}/`)),

  create: async (data: ClientFormData): Promise<Client> => {
    const names = splitFullName(data.nom)
    if (data.pieceJointe) {
      const formData = new FormData()
      formData.append('first_name', names.first_name)
      formData.append('last_name', names.last_name)
      formData.append('email', data.email || '')
      formData.append('phone', data.telephone || '')
      formData.append('address', data.adresse || '')
      formData.append('attachment', data.pieceJointe)
      const raw = await postMultipartJson<RawCustomer>('/customers/', formData)
      return mapCustomer(raw)
    }
    return mapCustomer(
      await apiRequest<RawCustomer>('/customers/', {
        method: 'POST',
        body: JSON.stringify({
          ...names,
          email: data.email || '',
          phone: data.telephone || '',
          address: data.adresse || '',
        }),
      })
    )
  },

  update: async (id: number, data: Partial<ClientFormData>): Promise<Client> => {
    const names = data.nom !== undefined ? splitFullName(data.nom) : null
    return mapCustomer(
      await apiRequest<RawCustomer>(`/customers/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(names ? names : {}),
          ...(data.email !== undefined ? { email: data.email || '' } : {}),
          ...(data.telephone !== undefined ? { phone: data.telephone || '' } : {}),
          ...(data.adresse !== undefined ? { address: data.adresse || '' } : {}),
        }),
      })
    )
  },

  delete: (id: number): Promise<void> => apiRequest<void>(`/customers/${id}/`, { method: 'DELETE' }),
}

export const commandesApi = {
  list: async (): Promise<PaginatedResponse<Commande>> => {
    const response = await apiRequest<RawOrder[] | PaginatedResponse<RawOrder>>('/orders/')
    const normalized = normalizeListResponse(response)
    return { ...normalized, results: normalized.results.map(mapOrder) }
  },

  get: async (id: number): Promise<Commande> => mapOrder(await apiRequest<RawOrder>(`/orders/${id}/`)),

  create: async (data: CommandeFormData): Promise<Commande> =>
    mapOrder(
      await apiRequest<RawOrder>('/orders/', {
        method: 'POST',
        body: JSON.stringify({
          customer: data.client,
          items: data.lignes.map((ligne) => ({
            product: ligne.article,
            quantity: ligne.quantite,
          })),
        }),
      })
    ),

  update: async (id: number, data: Partial<CommandeFormData>): Promise<Commande> =>
    mapOrder(
      await apiRequest<RawOrder>(`/orders/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(data.client !== undefined ? { customer: data.client } : {}),
          ...(data.lignes !== undefined
            ? {
                items: data.lignes.map((ligne) => ({
                  product: ligne.article,
                  quantity: ligne.quantite,
                })),
              }
            : {}),
        }),
      })
    ),

  delete: (id: number): Promise<void> => apiRequest<void>(`/orders/${id}/`, { method: 'DELETE' }),

  updateStatus: async (id: number, statut: OrderStatus): Promise<Commande> =>
    mapOrder(
      await apiRequest<RawOrder>(`/orders/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          status:
            statut === 'brouillon'
              ? 'draft'
              : statut === 'confirmee'
                ? 'confirmed'
                : statut === 'livree'
                  ? 'delivered'
                  : 'cancelled',
        }),
      })
    ),

  addLine: async (): Promise<Commande> => {
    throw new ApiError(501, 'Ajout de ligne non implemente dans cette integration.')
  },

  removeLine: async (): Promise<Commande> => {
    throw new ApiError(501, 'Suppression de ligne non implementee dans cette integration.')
  },
}

export const livraisonsApi = {
  list: async (options?: { ordersById?: Map<number, Commande> }): Promise<PaginatedResponse<Livraison>> => {
    const response = await apiRequest<PaginatedResponse<RawDelivery> | RawDelivery[]>('/deliveries/')
    const normalized = normalizeListResponse(response)
    return {
      ...normalized,
      results: normalized.results.map((delivery) => mapDelivery(delivery, options?.ordersById)),
    }
  },

  get: async (id: number): Promise<Livraison> =>
    mapDelivery(await apiRequest<RawDelivery>(`/deliveries/${id}/`)),

  create: async (data: LivraisonFormData): Promise<Livraison> =>
    mapDelivery(
      await apiRequest<RawDelivery>('/deliveries/', {
        method: 'POST',
        body: JSON.stringify({
          order: data.commande,
          address: data.adresse_livraison,
          scheduled_for: data.date_livraison_prevue,
          notes: data.notes || '',
        }),
      })
    ),

  update: async (id: number, data: Partial<LivraisonFormData>): Promise<Livraison> =>
    mapDelivery(
      await apiRequest<RawDelivery>(`/deliveries/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(data.commande !== undefined ? { order: data.commande } : {}),
          ...(data.adresse_livraison !== undefined ? { address: data.adresse_livraison } : {}),
          ...(data.date_livraison_prevue !== undefined ? { scheduled_for: data.date_livraison_prevue } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        }),
      })
    ),

  updateStatus: async (id: number, statut: DeliveryStatus): Promise<Livraison> =>
    mapDelivery(
      await apiRequest<RawDelivery>(`/deliveries/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: mapDeliveryStatusToApi(statut) }),
      })
    ),
}

export const facturesApi = {
  list: async (): Promise<PaginatedResponse<Facture>> => {
    const response = await apiRequest<RawOrder[] | PaginatedResponse<RawOrder>>('/orders/')
    const normalized = normalizeListResponse(response)
    const factures = normalized.results
      .filter((order) => ['confirmed', 'delivered'].includes(order.status))
      .map(mapFacture)

    return normalizeListResponse(factures)
  },
  get: async (): Promise<Facture> => {
    throw new ApiError(501, 'Factures non disponibles sur ce backend.')
  },
  generateForOrder: async (): Promise<Facture> => {
    throw new ApiError(501, 'Generation de facture non disponible sur ce backend.')
  },
  markAsPaid: async (): Promise<Facture> => {
    throw new ApiError(501, 'Paiement de facture non disponible sur ce backend.')
  },
  downloadPdf: async (id: number): Promise<Blob> => {
    const tokens = getTokens()
    const response = await fetch(`${API_BASE_URL}/orders/${id}/invoice/`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {},
    })
    if (!response.ok) {
      throw new ApiError(response.status, 'Impossible de telecharger la facture.')
    }
    return response.blob()
  },

  exportExcel: (): Promise<Blob> => fetchAuthorizedBlob('/exports/invoices/excel/'),

  exportPdfZip: (): Promise<Blob> => fetchAuthorizedBlob('/exports/invoices/pdf-zip/'),
}

export const mouvementsApi = {
  list: async (): Promise<PaginatedResponse<MouvementStock>> => {
    const response = await apiRequest<RawStockMovement[] | PaginatedResponse<RawStockMovement>>(
      '/stock-movements/'
    )
    const normalized = normalizeListResponse(response)
    return { ...normalized, results: normalized.results.map(mapStockMovement) }
  },
  create: async (data: {
    article: number
    type_mouvement: string
    quantite: number
    notes?: string
  }): Promise<MouvementStock> =>
    mapStockMovement(
      await apiRequest<RawStockMovement>('/stock-movements/', {
        method: 'POST',
        body: JSON.stringify({
          product: data.article,
          movement_type: mapMovementTypeToApi(data.type_mouvement),
          quantity: data.quantite,
          note: data.notes || '',
        }),
      })
    ),
}

export const journalApi = {
  list: async (): Promise<PaginatedResponse<JournalActivite>> => {
    const response = await apiRequest<RawActivityLog[] | PaginatedResponse<RawActivityLog>>(
      '/activity-logs/'
    )
    const normalized = normalizeListResponse(response)
    return { ...normalized, results: normalized.results.map(mapActivityLog) }
  },

  exportPdf: (): Promise<Blob> => fetchAuthorizedBlob('/exports/activity-logs/'),
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const raw = await apiRequest<RawDashboardStats>('/dashboard/stats/')
    return {
      total_articles: raw.products_count,
      total_clients: raw.customers_count,
      total_commandes: raw.orders_count,
      commandes_en_cours: raw.pending_deliveries_count,
      chiffre_affaires: raw.revenue_total,
      articles_en_rupture: raw.low_stock_count,
      commandes_recentes: raw.recent_orders.map((order) =>
        mapOrder({
          id: order.id,
          number: order.number,
          customer: 0,
          customer_name: order.customer_name,
          status: order.status,
          total: order.total,
          created_at: order.created_at,
          updated_at: order.created_at,
          items: [],
        })
      ),
      top_articles: [],
    }
  },
}

export const exportApi = {
  exportArticles: async (): Promise<Blob> => {
    const tokens = getTokens()
    const response = await fetch(`${API_BASE_URL}/exports/products/`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {},
    })
    return response.blob()
  },

  exportClients: async (): Promise<Blob> => {
    const tokens = getTokens()
    const response = await fetch(`${API_BASE_URL}/exports/customers/`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {},
    })
    return response.blob()
  },

  exportCommandes: async (): Promise<Blob> => {
    const tokens = getTokens()
    const response = await fetch(`${API_BASE_URL}/exports/orders/`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {},
    })
    return response.blob()
  },

  exportActivityLogs: (): Promise<Blob> => fetchAuthorizedBlob('/exports/activity-logs/'),

  importArticles: async (file: File): Promise<{ imported: number; errors: string[] }> => {
    const tokens = getTokens()
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(`${API_BASE_URL}/imports/products/`, {
      method: 'POST',
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {},
      body: formData,
    })
    return response.json()
  },
}

export { ApiError }
