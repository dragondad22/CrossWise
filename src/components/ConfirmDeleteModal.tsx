'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  isDeleting?: boolean
  onClose: () => void
  onConfirm: () => void
}

// Shared confirmation dialog for destructive actions (#15/#16). Destructive
// actions must never fire from a single unguarded click (CLAUDE.md); Cancel and
// Escape abort with zero side effects, and focus lands on the safe action first.
export default function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  confirmLabel,
  isDeleting = false,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDeleting, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={() => {
        if (!isDeleting) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4">
          <h2 id="confirm-delete-title" className="text-xl font-semibold text-foreground">
            {title}
          </h2>
          <div className="mt-2 text-sm text-muted-foreground">{description}</div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 sm:w-auto"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
