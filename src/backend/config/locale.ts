import { app } from 'electron'
import { loadGlobalConfig, saveGlobalConfig } from './paths'

export const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'it', 'pt', 'de'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const DEFAULT_LOCALE: SupportedLocale = 'es'

export function normalizeLocale(raw: string | undefined | null): SupportedLocale {
  if (!raw) return DEFAULT_LOCALE
  const base = raw.toLowerCase().split('-')[0]
  if (SUPPORTED_LOCALES.includes(base as SupportedLocale)) {
    return base as SupportedLocale
  }
  return DEFAULT_LOCALE
}

export function getSystemLocale(): SupportedLocale {
  try {
    return normalizeLocale(app.getLocale())
  } catch {
    return DEFAULT_LOCALE
  }
}

export function getStoredLocale(): SupportedLocale | null {
  const cfg = loadGlobalConfig()
  const loc = cfg.locale
  if (typeof loc === 'string') {
    const n = normalizeLocale(loc)
    if (SUPPORTED_LOCALES.includes(n)) return n
  }
  return null
}

export function getEffectiveLocale(): SupportedLocale {
  return getStoredLocale() ?? getSystemLocale()
}

export function setStoredLocale(locale: string): SupportedLocale {
  const normalized = normalizeLocale(locale)
  const cfg = loadGlobalConfig()
  cfg.locale = normalized
  saveGlobalConfig(cfg)
  return normalized
}
