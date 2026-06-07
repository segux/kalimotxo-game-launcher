import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getLoadingTips } from '../../i18n'
import { KalimotxoLogo } from './KalimotxoLogo'

type LoadingSplashProps = {
  statusKey?: 'statusDefault' | 'statusSetup' | 'statusBattleNet' | 'statusSystem'
  statusText?: string
  percent?: number
  compact?: boolean
  showTips?: boolean
  className?: string
}

export function LoadingSplash({
  statusKey = 'statusDefault',
  statusText,
  percent,
  compact = false,
  showTips = true,
  className
}: LoadingSplashProps) {
  const { t, i18n } = useTranslation('loading')
  const [tipIndex, setTipIndex] = useState(0)
  const [tipKey, setTipKey] = useState(0)

  const tips = getLoadingTips()
  const status = statusText ?? t(statusKey)

  useEffect(() => {
    if (!showTips || tips.length === 0) return
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length)
      setTipKey((k) => k + 1)
    }, 5000)
    return () => window.clearInterval(id)
  }, [showTips, tips.length, i18n.language])

  const currentTip = tips[tipIndex] ?? ''

  return (
    <div
      className={cn(
        'launcher-bg flex flex-col items-center justify-center px-8 text-center',
        compact ? 'py-12' : 'h-full min-h-[200px]',
        className
      )}
    >
      <KalimotxoLogo
        variant="icon"
        size={compact ? 56 : 280}
        animated
        className={cn('mb-6', !compact && 'mb-10')}
      />

      <div className="flex items-center gap-2 text-white/60">
        <Loader2 className="animate-spin shrink-0" size={18} />
        <p className="text-sm">{status}</p>
      </div>

      {percent !== undefined && percent > 0 && (
        <div className="mt-4 w-full max-w-xs">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-kal-accent transition-all"
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
        </div>
      )}

      {showTips && currentTip && (
        <p
          key={tipKey}
          className={cn(
            'kal-tip-animate mt-8 max-w-md text-sm leading-relaxed text-white/45',
            compact && 'mt-4 text-xs'
          )}
        >
          {currentTip}
        </p>
      )}
    </div>
  )
}
