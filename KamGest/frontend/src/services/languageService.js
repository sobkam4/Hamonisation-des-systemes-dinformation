const LANGUAGE_KEY = 'kamgestion-language'

export function getStoredLanguage() {
  if (typeof window === 'undefined') {
    return 'fr'
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY)

  if (storedLanguage === 'fr' || storedLanguage === 'en') {
    return storedLanguage
  }

  return 'fr'
}

export function applyLanguage(language) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.lang = language
}

export function setStoredLanguage(language) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_KEY, language)
  }

  applyLanguage(language)
}

export function initializeLanguage() {
  applyLanguage(getStoredLanguage())
}
