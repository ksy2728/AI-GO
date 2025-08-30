'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, defaultLocale, getTranslations } from '@/lib/i18n'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  translations: any
  t: (key: string) => string
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [translations, setTranslations] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  // Initialize translations immediately
  useEffect(() => {
    const initTranslations = async () => {
      const savedLocale = localStorage.getItem('locale') as Locale
      const targetLocale = (savedLocale && ['en', 'ko', 'es', 'ja', 'zh'].includes(savedLocale)) 
        ? savedLocale 
        : defaultLocale
      
      if (!savedLocale) {
        localStorage.setItem('locale', defaultLocale)
      }
      
      setLocaleState(targetLocale)
      
      // Load translations immediately
      try {
        const trans = await getTranslations(targetLocale)
        setTranslations(trans)
      } catch (error) {
        console.error('Failed to load initial translations:', error)
      }
    }
    
    initTranslations()
  }, [])

  // Load translations when locale changes (only for manual locale changes)
  useEffect(() => {
    const loadTranslations = async () => {
      // Skip if this is the initial load (handled above)
      if (Object.keys(translations).length === 0) return
      
      try {
        const trans = await getTranslations(locale)
        setTranslations(trans)
      } catch (error) {
        console.error('Failed to load translations:', error)
      }
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
    <LanguageContext.Provider value={{ locale, setLocale, translations, t, isLoading }}>
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