import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './authStorage.js'

function notifyUnauthorized() {
  window.dispatchEvent(new CustomEvent('auth:unauthorized'))
}

let refreshRequest = null

async function refreshAccessToken() {
  if (refreshRequest) {
    return refreshRequest
  }

  const refresh = getRefreshToken()

  if (!refresh) {
    clearTokens()
    notifyUnauthorized()
    throw new Error('Session expiree.')
  }

  refreshRequest = fetch('/api/auth/refresh/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Impossible de rafraichir le token.')
      }

      const data = await response.json()
      setTokens({
        access: data.access,
        refresh: data.refresh || refresh,
      })

      return data.access
    })
    .catch((error) => {
      clearTokens()
      notifyUnauthorized()
      throw error
    })
    .finally(() => {
      refreshRequest = null
    })

  return refreshRequest
}

async function fetchWithAuth(url, options = {}, allowRefresh = true) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = { ...options.headers }
  const isFormData = options.body instanceof FormData

  if (options.body && !headers['Content-Type'] && !isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const accessToken = getAccessToken()

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  let response = await fetch(url, {
    ...options,
    method,
    headers,
  })

  if (
    response.status === 401 &&
    allowRefresh &&
    !url.startsWith('/api/auth/login/') &&
    !url.startsWith('/api/auth/refresh/')
  ) {
    const newAccessToken = await refreshAccessToken()
    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${newAccessToken}`,
    }

    response = await fetch(url, {
      ...options,
      method,
      headers: retryHeaders,
    })
  }

  return response
}

export async function apiRequest(url, options = {}) {
  const response = await fetchWithAuth(url, options)

  if (!response.ok) {
    let message = `Erreur HTTP ${response.status}`

    try {
      const data = await response.json()
      message = data.detail || JSON.stringify(data)
    } catch {
      message = response.statusText || message
    }

    const error = new Error(message)
    error.status = response.status

    if (response.status === 401 && !url.startsWith('/api/auth/')) {
      clearTokens()
      notifyUnauthorized()
    }

    throw error
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export async function apiBlobRequest(url, options = {}) {
  const response = await fetchWithAuth(url, options)

  if (!response.ok) {
    let message = `Erreur HTTP ${response.status}`

    try {
      const data = await response.json()
      message = data.detail || JSON.stringify(data)
    } catch {
      message = response.statusText || message
    }

    const error = new Error(message)
    error.status = response.status

    if (response.status === 401 && !url.startsWith('/api/auth/')) {
      clearTokens()
      notifyUnauthorized()
    }

    throw error
  }

  return response.blob()
}

export async function apiBlobResponse(url, options = {}) {
  const response = await fetchWithAuth(url, options)

  if (!response.ok) {
    let message = `Erreur HTTP ${response.status}`

    try {
      const data = await response.json()
      message = data.detail || JSON.stringify(data)
    } catch {
      message = response.statusText || message
    }

    const error = new Error(message)
    error.status = response.status

    if (response.status === 401 && !url.startsWith('/api/auth/')) {
      clearTokens()
      notifyUnauthorized()
    }

    throw error
  }

  const blob = await response.blob()

  return { blob, response }
}

export async function downloadBlob(url, filename) {
  const blob = await apiBlobRequest(url)
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
