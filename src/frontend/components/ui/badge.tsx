import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Badge({
  ok,
  children
}: {
  ok: boolean
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-200'
      )}
    >
      {children}
    </span>
  )
}
