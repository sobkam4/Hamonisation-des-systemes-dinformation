// Configuration de l'API pour l'intégration frontend-backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Configuration des endpoints API
export const API_ENDPOINTS = {
  BIENS: {
    LIST: '/biens/',
    DETAIL: (id: number) => `/biens/${id}/`
  },
  CLIENTS: {
    LIST: '/clients/',
    DETAIL: (id: number) => `/clients/${id}/`
  },
  CONTRATS: {
    LIST: '/contrats/',
    DETAIL: (id: number) => `/contrats/${id}/`
  },
  PAIEMENTS: {
    LIST: '/paiements/',
    DETAIL: (id: number) => `/paiements/${id}/`
  },
  DEPENSES: {
    LIST: '/depenses/',
    DETAIL: (id: number) => `/depenses/${id}/`
  },
  NOTIFICATIONS: {
    LIST: '/notifications/'
  },
  DOCUMENTS: {
    LIST: '/documents/'
  },
  AUTH: {
    LOGIN: '/auth/login/',
    PROFILE: '/auth/profile/'
  }
};

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Configuration du client API
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    
    // Récupérer le token depuis localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  // Méthode pour définir le token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  // Méthode pour supprimer le token
  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // Méthode générique pour les requêtes
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOn401: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Ajouter le token d'authentification
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Gérer les erreurs 401 (token expiré) - sauf pour les endpoints de login/register
      // car ces endpoints n'ont pas besoin de token
      const isAuthEndpoint = endpoint.includes('/auth/login/') || endpoint.includes('/auth/register/');
      if (response.status === 401 && !isAuthEndpoint && retryOn401) {
        // Essayer de rafraîchir le token
        const refreshSuccess = await this.handleTokenExpired();
        
        if (refreshSuccess) {
          // Réessayer la requête avec le nouveau token (une seule fois)
          // Mettre à jour le header Authorization avec le nouveau token
          const newHeaders = { ...headers };
          if (this.token) {
            newHeaders['Authorization'] = `Bearer ${this.token}`;
          }
          const retryConfig: RequestInit = {
            ...options,
            headers: newHeaders,
          };
          const retryResponse = await fetch(url, retryConfig);
          
          // Traiter la réponse de la nouvelle tentative
          if (!retryResponse.ok && retryResponse.status === 401) {
            // Même après rafraîchissement, toujours 401 - rediriger vers login
            this.removeToken();
            if (typeof window !== 'undefined') {
              window.location.replace('/login');
            }
            const redirectError: any = new Error('Redirection en cours');
            redirectError.isRedirecting = true;
            redirectError.silent = true;
            throw redirectError;
          }
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            const error: any = new Error(errorData.message || errorData.detail || `HTTP error! status: ${retryResponse.status}`);
            error.response = { data: errorData, status: retryResponse.status };
            throw error;
          }
          
          const data = await retryResponse.json();
          return { data, message: 'Success', status: retryResponse.status };
        } else {
          // Échec du rafraîchissement - rediriger vers login
          this.removeToken();
          if (typeof window !== 'undefined') {
            window.location.replace('/login');
          }
          const redirectError: any = new Error('Redirection en cours');
          redirectError.isRedirecting = true;
          redirectError.silent = true;
          throw redirectError;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: any = new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        error.response = { data: errorData, status: response.status };
        throw error;
      }

      const data = await response.json();
      return { data, message: 'Success', status: response.status };
    } catch (error: any) {
      // Si c'est une erreur de redirection, la propager silencieusement
      if (error.isRedirecting && error.silent) {
        throw error;
      }
      
      console.error('API Error:', error);
      throw error;
    }
  }

  // Méthode pour gérer l'expiration du token
  private async handleTokenExpired(): Promise<boolean> {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      
      if (!refreshToken) {
        console.warn('Aucun token de rafraîchissement disponible');
        return false;
      }

      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.access);
        
        // Sauvegarder le nouveau refresh token s'il est fourni
        if (data.refresh) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('refresh_token', data.refresh);
          }
        }
        return true; // Rafraîchissement réussi
      } else {
        // Pas de token dans la réponse
        console.warn('Aucun token dans la réponse de rafraîchissement');
        this.removeToken();
        if (typeof window !== 'undefined') {
          window.location.replace('/login');
        }
        return false;
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      this.removeToken();
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
      return false;
    }
  }

  // Méthode GET
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  // Méthode GET pour les blobs (fichiers)
  async getBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    // Ajouter le token d'authentification
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  }

  // Méthode POST
  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Méthode PUT
  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Méthode PATCH
  async patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Méthode DELETE
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Méthode pour uploader des fichiers
  async upload<T>(endpoint: string, file: File, retryOn401: boolean = true): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {};

    // Ajouter le token d'authentification
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method: 'POST',
      headers,
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          data: errorData,
          message: errorData.message || errorData.detail || `HTTP error! status: ${response.status}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return { data, message: 'Upload successful', status: response.status };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
}

// Exporter une instance unique du client API
export const apiClient = new ApiClient();

// Exporter la classe pour les tests ou utilisation avancée
export { ApiClient };
