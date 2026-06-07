import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import type { StoreDefinition } from 'common/types/store'
import { cn } from '../../lib/utils'
import { StoreBackdrop } from './StoreBackdrop'
import { StoreLogo } from './StoreLogo'

export function StoreCard({ store, size = 'md' }: { store: StoreDefinition; size?: 'md' | 'lg' }) {
  const { t } = useTranslation('stores')
  const locked = store.availability !== 'available'
  const isLg = size === 'lg'
  const tagline = t(`taglines.${store.id}`, { defaultValue: store.tagline })

  const availLabel =
    store.availability === 'coming_soon'
      ? t('availability.coming_soon')
      : t('availability.planned')

  return (
    <Link
      to={locked ? '#' : store.route}
      onClick={(e) => locked && e.preventDefault()}
      className={cn(
        'group relative shrink-0 overflow-hidden rounded-xl border border-white/[0.08] transition',
        'hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl',
        locked && 'cursor-not-allowed opacity-80 hover:scale-100',
        isLg ? 'h-52 w-[340px]' : 'h-40 w-[260px]'
      )}
    >
      <StoreBackdrop store={store} variant="card" className="absolute inset-0" />

      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-black/40 p-2 backdrop-blur-sm">
            <StoreLogo storeId={store.id} size={isLg ? 'lg' : 'md'} />
          </div>
          {locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur">
              <Lock size={10} />
              {availLabel}
            </span>
          )}
        </div>

        <div>
          <h3 className={cn('font-bold text-white drop-shadow-sm', isLg ? 'text-xl' : 'text-base')}>
            {store.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-white/75">{tagline}</p>
          {!locked && (
            <span
              className="mt-2 inline-block rounded-md px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow transition group-hover:opacity-100"
              style={{ backgroundColor: store.accentColor }}
            >
              {t('common:actions.manage', { defaultValue: 'Abrir' })}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
