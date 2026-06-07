import { useTranslation } from 'react-i18next'
import { STORES, getFeaturedStore } from '../config/stores'
import { StoreHero } from '../components/stores/StoreHero'
import { StoreCard } from '../components/stores/StoreCard'

export default function PlatformsScreen() {
  const { t } = useTranslation('stores')
  const featured = getFeaturedStore()
  const available = STORES.filter((s) => s.availability === 'available')
  const upcoming = STORES.filter((s) => s.availability !== 'available')

  return (
    <div className="pb-10">
      <StoreHero store={featured} />

      <section className="mt-10 px-6">
        <h2 className="text-lg font-semibold text-white/90">{t('platforms.myPlatforms')}</h2>
        <p className="mt-1 text-sm text-white/45">{t('platforms.myPlatformsSub')}</p>
        <div className="store-carousel mt-4 flex gap-4 overflow-x-auto pb-2">
          {available.map((store) => (
            <StoreCard key={store.id} store={store} size="lg" />
          ))}
        </div>
      </section>

      <section className="mt-10 px-6">
        <h2 className="text-lg font-semibold text-white/90">{t('platforms.comingSoon')}</h2>
        <p className="mt-1 text-sm text-white/45">{t('platforms.comingSoonSub')}</p>
        <div className="store-carousel mt-4 flex gap-4 overflow-x-auto pb-2">
          {upcoming.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </section>
    </div>
  )
}
