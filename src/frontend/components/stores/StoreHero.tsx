import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { StoreDefinition } from 'common/types/store'
import { Button } from '../ui/button'
import { StoreBackdrop } from './StoreBackdrop'
import { StoreLogo } from './StoreLogo'

export function StoreHero({ store }: { store: StoreDefinition }) {
  const { t } = useTranslation('stores')
  const tagline = t(`taglines.${store.id}`, { defaultValue: store.tagline })

  return (
    <section className="relative mx-6 mt-6 overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
      <StoreBackdrop store={store} variant="hero" className="min-h-[300px]" />

      <div className="relative flex min-h-[300px] flex-col justify-end p-8 md:max-w-2xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-xl bg-black/50 p-3 backdrop-blur-md ring-1 ring-white/10">
            <StoreLogo storeId={store.id} size="xl" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            {t('platforms.featured')}
          </p>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">{store.name}</h1>
        <p className="mt-2 text-sm text-white/80">{tagline}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {store.games.slice(0, 4).map((g) => (
            <li
              key={g}
              className="rounded-full border border-white/20 bg-black/30 px-2.5 py-0.5 text-xs text-white/90 backdrop-blur-sm"
            >
              {g}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={store.route}>
            <Button className="gap-1 shadow-lg" style={{ backgroundColor: store.accentColor }}>
              {t('common:actions.manage', { defaultValue: 'Gestionar' })}
              <ChevronRight size={16} />
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="outline" className="border-white/30 bg-black/40 text-white backdrop-blur">
              {t('platforms.runtimeWine')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
