import * as React from 'react'

import { cn } from '@/lib/utils'

const variantClasses = {
  solid:
    'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/60',
  outline:
    'border border-border text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/40',
  ghost: 'text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/40',
} as const

const sizeClasses = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  sm: 'h-9 px-3 text-xs',
} as const

export type ButtonVariant = keyof typeof variantClasses
export type ButtonSize = keyof typeof sizeClasses

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function buttonClasses({
  variant = 'solid',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'solid', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={buttonClasses({ variant, size, className })}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
