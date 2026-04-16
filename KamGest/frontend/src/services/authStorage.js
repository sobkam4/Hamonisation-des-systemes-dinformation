const ACCESS_TOKEN_KEY = 'ticketing.accessToken'
const REFRESH_TOKEN_KEY = 'ticketing.refreshToken'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export function setTokens(tokens) {
  if (tokens.access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
  }

  if (tokens.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
