'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, defaultLocale, getTranslations } from '@/lib/i18n'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  translations: any
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [translations, setTranslations] = useState<any>({})

  // Load saved locale from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && ['en', 'ko', 'es', 'ja', 'zh'].includes(savedLocale)) {
      setLocaleState(savedLocale)
    }
  }, [])

  // Load translations when locale changes
  useEffect(() => {
    const loadTranslations = async () => {
      const trans = await getTranslations(locale)
      setTranslations(trans)
    }
    loadTranslations()
  }, [locale])

  // Set locale and save to localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  // Translation function
  const t = (key: string): string => {
    const keys = key.split('.')
    let value = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, translations, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}