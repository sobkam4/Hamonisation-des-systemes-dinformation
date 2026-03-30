import { createContext, useEffect, useMemo, useState } from 'react'

import { translations } from '../i18n/translations.js'
import { getStoredLanguage, setStoredLanguage } from '../services/languageService.js'

export const LanguageContext = createContext(null)

function getValueByPath(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object)
}

function interpolate(value, params = {}) {
  if (typeof value !== 'string') {
    return value
  }

  return value.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? ''))
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => getStoredLanguage())

  useEffect(() => {
    setStoredLanguage(language)
  }, [language])

  const value = useMemo(() => ({
    language,
    setLanguage,
    t(path, params) {
      const currentTranslations = translations[language] || translations.fr
      const fallbackTranslations = translations.fr
      const rawValue = getValueByPath(currentTranslations, path) ?? getValueByPath(fallbackTranslations, path) ?? path

      if (Array.isArray(rawValue)) {
        return rawValue.map((item) => interpolate(item, params))
      }

      return interpolate(rawValue, params)
    },
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
