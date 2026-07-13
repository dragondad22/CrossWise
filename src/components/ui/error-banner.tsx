import { cn } from '@/lib/utils'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

// Shared failure-state banner for data-driven views (#36). Announced to
// assistive tech via role="alert"; offers retry and dismiss affordances so a
// failed fetch is never a silent dead end.
export function ErrorBanner({ message, onRetry, onDismiss, className }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700',
        className,
      )}
    >
      <p className="min-w-0 break-words">{message}</p>
      <div className="flex shrink-0 items-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="font-medium text-red-800 underline underline-offset-2 transition-colors hover:text-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try again
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="rounded p-1 leading-none text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
