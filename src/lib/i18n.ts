import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

export const locales = ['en', 'ko', 'es', 'ja', 'zh'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

// Language display names
export const languageNames: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  es: 'Español',
  ja: '日本語',
  zh: '中文'
}

// Language flags (emoji)
export const languageFlags: Record<Locale, string> = {
  en: '🇬🇧',
  ko: '🇰🇷',
  es: '🇪🇸',
  ja: '🇯🇵',
  zh: '🇨🇳'
}

// Get locale from browser headers
export function getLocaleFromHeaders(headers: Headers): Locale {
  const acceptLanguage = headers.get('accept-language') || ''
  const languages = new Negotiator({ 
    headers: { 'accept-language': acceptLanguage } 
  }).languages()
  
  try {
    return match(languages, locales, defaultLocale) as Locale
  } catch {
    return defaultLocale
  }
}

// Load translations for a locale
export async function getTranslations(locale: Locale) {
  try {
    const translations = await import(`@/locales/${locale}.json`)
    return translations.default
  } catch (error) {
    console.error(`Failed to load translations for ${locale}`, error)
    // Fallback to English
    const fallback = await import('@/locales/en.json')
    return fallback.default
  }
}

// Get nested translation value
export function getTranslation(translations: any, key: string): string {
  const keys = key.split('.')
  let value = translations
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key
}