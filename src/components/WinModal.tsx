'use client'

import { useRouter } from 'next/navigation'

interface WinModalProps {
  isOpen: boolean
  onNewPuzzle: () => void
  onClose: () => void
}

export default function WinModal({ isOpen, onNewPuzzle, onClose }: WinModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleBackToMenu = () => {
    onClose()
    router.push('/topics')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-8 text-center shadow-card">
        <div className="mb-6 space-y-3">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-semibold text-foreground">Puzzle complete!</h2>
          <p className="text-sm text-muted-foreground">
            Every square is correct — nice work. Generate a fresh layout or browse for a new topic.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onNewPuzzle}
            className="w-full rounded-full bg-primary px-6 py-3 text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            🧩 Play another puzzle
          </button>
          <button
            onClick={handleBackToMenu}
            className="w-full rounded-full border border-border px-6 py-3 text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            📚 Back to topics
          </button>
        </div>
      </div>
    </div>
  )
}
