const THEME_KEY = 'kamgestion-theme'

export function getStoredTheme() {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedTheme = window.localStorage.getItem(THEME_KEY)

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
}

export function setStoredTheme(theme) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_KEY, theme)
  }

  applyTheme(theme)
}

export function initializeTheme() {
  applyTheme(getStoredTheme())
}
