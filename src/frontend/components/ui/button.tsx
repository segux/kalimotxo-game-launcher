import { cn } from '../../lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'outline' | 'ghost'

const variants: Record<Variant, string> = {
  default: 'bg-kal-accent hover:bg-kal-accent-hover text-white',
  outline: 'border border-white/20 hover:bg-white/5',
  ghost: 'hover:bg-white/10'
}

export function Button({
  className,
  variant = 'default',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'no-drag inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-40',
        variants[variant],
        className
      )}
      disabled={disabled}
      {...props}
    />
  )
}
