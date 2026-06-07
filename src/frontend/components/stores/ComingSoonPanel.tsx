import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import type { StoreDefinition } from 'common/types/store'
import { Button } from '../ui/button'
import { StoreLogo } from './StoreLogo'

export function ComingSoonPanel({ store }: { store: StoreDefinition }) {
  const { t } = useTranslation('stores')
  const tagline = t(`taglines.${store.id}`, { defaultValue: store.tagline })

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <div
        className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-2xl shadow-2xl ring-1 ring-white/10"
        style={{ background: store.gradient }}
      >
        <StoreLogo storeId={store.id} size="hero" />
      </div>
      <h1 className="text-2xl font-bold">{store.name}</h1>
      <p className="mt-2 text-white/60">{tagline}</p>
      <ul className="mt-4 flex flex-wrap justify-center gap-2">
        {store.games.map((g) => (
          <li
            key={g}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-xs text-white/70"
          >
            {g}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-white/45">
        {t('comingSoon.body', { store: store.name })}
      </p>
      <Button variant="outline" className="mt-8 gap-2" disabled>
        <Bell size={16} />
        {t('comingSoon.notify')}
      </Button>
      <p className="mt-3 text-xs text-white/30">{t('comingSoon.hint')}</p>
    </div>
  )
}
