import type { StoreDefinition } from 'common/types/store'
import { StoreLogo, getStoreBannerUrl } from './StoreLogo'
import { cn } from '../../lib/utils'

type Variant = 'card' | 'hero' | 'header'

export function StoreBackdrop({
  store,
  variant = 'card',
  className
}: {
  store: StoreDefinition
  variant?: Variant
  className?: string
}) {
  const banner = getStoreBannerUrl(store.id)
  const isHero = variant === 'hero'
  const isHeader = variant === 'header'

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={banner}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: store.gradient }}
      />
      <div
        className={cn(
          'absolute inset-0',
          isHero && 'bg-gradient-to-r from-black/85 via-black/50 to-black/20',
          isHeader && 'bg-gradient-to-t from-kal-bg via-black/60 to-black/30',
          variant === 'card' && 'bg-gradient-to-t from-black/90 via-black/40 to-black/10'
        )}
      />
      {/* Logo marca de agua */}
      <div
        className={cn(
          'pointer-events-none absolute flex items-center justify-center text-white/15',
          isHero && 'right-8 top-1/2 -translate-y-1/2',
          isHeader && 'right-6 top-1/2 -translate-y-1/2 opacity-20',
          variant === 'card' && 'right-3 top-3 opacity-25'
        )}
      >
        <StoreLogo
          storeId={store.id}
          size={isHero ? 'hero' : isHeader ? 'xl' : 'lg'}
          colored={false}
          className="text-white"
        />
      </div>
    </div>
  )
}
