import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { SupportedLocale } from 'common/types/ipc'
import { i18n } from '../i18n'
import { cn } from '../lib/utils'
import { LoadingSplash } from '../components/brand/LoadingSplash'
import SetupScreen from './SetupScreen'
import WineManagerScreen from './WineManagerScreen'

const TAB_IDS = ['runtime', 'wine', 'system'] as const
type TabId = (typeof TAB_IDS)[number]

const LOCALE_CODES: SupportedLocale[] = ['es', 'en', 'fr', 'it', 'pt', 'de']

export default function SettingsScreen() {
  const { t } = useTranslation('settings')
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabId | null) ?? 'runtime'
  const [tab, setTab] = useState<TabId>(
    TAB_IDS.includes(initialTab as TabId) ? initialTab : 'runtime'
  )
  const [hw, setHw] = useState<Record<string, unknown> | null>(null)
  const [locale, setLocale] = useState<SupportedLocale>('es')

  useEffect(() => {
    const q = searchParams.get('tab') as TabId | null
    if (q && TAB_IDS.includes(q)) setTab(q)
  }, [searchParams])

  useEffect(() => {
    window.api.getLocale().then(setLocale)
  }, [])

  useEffect(() => {
    if (tab === 'system') {
      setHw(null)
      window.api.getSystemStatus().then((s) => setHw(s.hardware))
    }
  }, [tab])

  const onLocaleChange = async (code: SupportedLocale) => {
    const saved = await window.api.setLocale(code)
    setLocale(saved)
    await i18n.changeLanguage(saved)
  }

  const tabs = TAB_IDS.map((id) => ({ id, label: t(`tabs.${id}`) }))

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="mt-1 text-sm text-white/45">{t('subtitle')}</p>

      <div className="mt-6 max-w-3xl rounded-xl border border-white/[0.08] bg-kal-panel/50 p-4">
        <h2 className="text-sm font-semibold text-white/90">{t('language.title')}</h2>
        <p className="mt-1 text-xs text-white/45">{t('language.description')}</p>
        <select
          value={locale}
          onChange={(e) => onLocaleChange(e.target.value as SupportedLocale)}
          className="mt-3 w-full max-w-xs rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-kal-accent"
        >
          {LOCALE_CODES.map((code) => (
            <option key={code} value={code}>
              {t(`language.names.${code}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex gap-2 border-b border-white/[0.08]">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition -mb-px',
              tab === tb.id
                ? 'border-kal-accent text-white'
                : 'border-transparent text-white/45 hover:text-white/70'
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-3xl">
        {tab === 'runtime' && <SetupScreen />}
        {tab === 'wine' && <WineManagerScreen />}
        {tab === 'system' &&
          (hw === null ? (
            <LoadingSplash statusKey="statusSystem" compact showTips />
          ) : (
            <pre className="overflow-auto rounded-xl border border-white/[0.08] bg-black/30 p-4 text-xs text-white/70">
              {JSON.stringify(hw, null, 2)}
            </pre>
          ))}
      </div>
    </div>
  )
}
