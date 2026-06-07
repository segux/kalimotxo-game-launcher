import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'it', 'pt', 'de'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const NAMESPACES = ['common', 'loading', 'setup', 'settings', 'stores'] as const

const localeFiles = import.meta.glob<{ default: Record<string, unknown> }>(
  './locales/*/*.json',
  { eager: true }
)

function buildResources(): Record<string, Record<string, Record<string, unknown>>> {
  const resources: Record<string, Record<string, Record<string, unknown>>> = {}
  for (const path of Object.keys(localeFiles)) {
    const m = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/)
    if (!m) continue
    const [, lng, ns] = m
    if (!resources[lng]) resources[lng] = {}
    const mod = localeFiles[path]
    resources[lng][ns] = (mod.default ?? mod) as Record<string, unknown>
  }
  return resources
}

const resources = buildResources()

export async function initI18n(locale?: string): Promise<typeof i18n> {
  const lng = locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale : 'es'

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: 'es',
      ns: [...NAMESPACES],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      returnNull: false
    })
  } else if (i18n.language !== lng) {
    await i18n.changeLanguage(lng)
  }

  return i18n
}

/** Traduce mensajes de progreso del backend (`setup.progress.*`) o devuelve el texto tal cual. */
export function translateProgressMessage(message: string): string {
  if (message.startsWith('setup.progress.')) {
    const sub = message.slice('setup.progress.'.length)
    return i18n.t(`progress.${sub}`, { ns: 'setup', defaultValue: message })
  }
  return message
}

export function getLoadingTips(): string[] {
  const tips = i18n.t('tips', { ns: 'loading', returnObjects: true })
  if (Array.isArray(tips)) return tips as string[]
  return []
}

export { i18n }
