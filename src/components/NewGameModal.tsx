'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { WORD_COUNT_BOUNDS } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { ListWithItemsAndTopic } from '@/types/database'

interface NewGameModalProps {
  isOpen: boolean
  list: ListWithItemsAndTopic | null
  isGenerating?: boolean
  onClose: () => void
  // undefined wordCount = use every word (up to the server cap).
  onStart: (wordCount: number | undefined) => void
}

const PRESETS = [10, 15, 20, 30, 50]

// Puzzle-size chooser for the new-game flow (#22). Presets are capped to the
// list's item count; "All words" is the default and sends no wordCount, which
// preserves the previous behaviour.
export default function NewGameModal({
  isOpen,
  list,
  isGenerating = false,
  onClose,
  onStart,
}: NewGameModalProps) {
  const [selected, setSelected] = useState<number | 'all'>('all')
  const startRef = useRef<HTMLButtonElement>(null)

  const itemCount = list?.items?.length ?? 0

  const options = useMemo(() => {
    const presets = PRESETS.filter(
      (count) => count >= WORD_COUNT_BOUNDS.min && count < itemCount,
    )
    return presets
  }, [itemCount])

  useEffect(() => {
    if (isOpen) {
      setSelected('all')
      startRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isGenerating) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isGenerating, onClose])

  if (!isOpen || !list) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={() => {
        if (!isGenerating) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-game-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="new-game-title" className="text-xl font-semibold text-foreground">
          New puzzle from &quot;{list.name}&quot;
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how many words to include. Smaller puzzles are quicker; more words make a bigger
          challenge.
        </p>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Puzzle size">
          {options.map((count) => {
            const isActive = selected === count
            return (
              <button
                key={count}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelected(count)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  isActive
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border/70 text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                {isActive ? '✓ ' : ''}
                {count} words
              </button>
            )
          })}
          <button
            type="button"
            aria-pressed={selected === 'all'}
            onClick={() => setSelected('all')}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              selected === 'all'
                ? 'border-primary bg-primary/10 font-semibold text-primary'
                : 'border-border/70 text-muted-foreground hover:border-border hover:text-foreground',
            )}
          >
            {selected === 'all' ? '✓ ' : ''}
            All words ({itemCount})
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            ref={startRef}
            type="button"
            className="w-full sm:w-auto"
            onClick={() => onStart(selected === 'all' ? undefined : selected)}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating…' : 'Start puzzle'}
          </Button>
        </div>
      </div>
    </div>
  )
}
