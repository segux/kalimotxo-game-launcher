import { Navigate, useParams } from 'react-router-dom'
import { getStore } from '../config/stores'
import { BattleNetPanel } from '../components/stores/BattleNetPanel'
import { ComingSoonPanel } from '../components/stores/ComingSoonPanel'
import { StoreBackdrop } from '../components/stores/StoreBackdrop'
import { StoreLogo } from '../components/stores/StoreLogo'

export default function StoreDetailScreen() {
  const { storeId } = useParams<{ storeId: string }>()
  const store = storeId ? getStore(storeId) : undefined

  if (!store) return <Navigate to="/" replace />

  return (
    <div>
      <div className="relative h-44 border-b border-white/[0.06]">
        <StoreBackdrop store={store} variant="header" className="absolute inset-0" />
        <div className="relative flex h-full items-end gap-4 px-8 pb-5">
          <div className="rounded-xl bg-black/50 p-3 backdrop-blur-md ring-1 ring-white/10">
            <StoreLogo storeId={store.id} size="xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-md">{store.name}</h1>
            <p className="text-sm text-white/75">{store.tagline}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {store.availability === 'available' && store.id === 'battlenet' && <BattleNetPanel />}
        {store.availability !== 'available' && <ComingSoonPanel store={store} />}
      </div>
    </div>
  )
}
