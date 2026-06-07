import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'

export default function DownloadsScreen() {
  const { t } = useTranslation('stores')

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <Download className="mb-4 text-white/20" size={56} strokeWidth={1} />
      <h1 className="text-xl font-semibold">{t('downloads.title')}</h1>
      <p className="mt-2 max-w-sm text-sm text-white/45">{t('downloads.subtitle')}</p>
    </div>
  )
}
