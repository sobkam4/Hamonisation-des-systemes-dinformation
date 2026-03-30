import { apiRequest } from './apiClient.js'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './authStorage.js'

export async function initializeSession() {
  if (!getAccessToken() && !getRefreshToken()) {
    return null
  }

  try {
    return await apiRequest('/api/auth/me/')
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      return null
    }

    throw error
  }
}

export async function loginUser(credentials) {
  const data = await apiRequest('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  setTokens(data.tokens)
  return data.user
}

export async function logoutUser() {
  clearTokens()
}
