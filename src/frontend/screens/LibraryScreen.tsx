import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Gamepad2 } from 'lucide-react'
import { getAvailableStores } from '../config/stores'
import { StoreLogo } from '../components/stores/StoreLogo'
import { getStoreBannerUrl } from '../components/stores/StoreLogo'

export default function LibraryScreen() {
  const { t } = useTranslation('stores')
  const stores = getAvailableStores()

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold">{t('library.title')}</h1>
      <p className="mt-1 text-sm text-white/50">{t('library.subtitle')}</p>

      {stores.length === 0 ? (
        <div className="mt-16 text-center text-white/40">
          <Gamepad2 className="mx-auto mb-4 opacity-30" size={48} />
          <p>{t('library.empty')}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Link
              key={store.id}
              to={store.route}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] transition hover:border-white/15"
            >
              <img
                src={getStoreBannerUrl(store.id)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="relative flex items-center gap-4 p-4">
                <div className="rounded-lg bg-black/50 p-2.5 backdrop-blur-sm">
                  <StoreLogo storeId={store.id} size="lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{store.name}</h3>
                  <p className="text-xs text-white/55">{t('library.openManager')}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-12 max-w-md text-xs text-white/30">{t('library.footer')}</p>
    </div>
  )
}
