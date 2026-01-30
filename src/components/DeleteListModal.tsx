'use client'

import { Button } from '@/components/ui/button'
import { ListWithItemsAndTopic } from '@/types/database'

interface DeleteListModalProps {
  isOpen: boolean
  list: ListWithItemsAndTopic | null
  isDeleting?: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteListModal({
  isOpen,
  list,
  isDeleting = false,
  onClose,
  onConfirm,
}: DeleteListModalProps) {
  if (!isOpen || !list) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">Delete &quot;{list.name}&quot;?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This permanently deletes the word list and every puzzle created from it. This action
            cannot be undone.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
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
            {isDeleting ? 'Deleting…' : 'Delete list'}
          </Button>
        </div>
      </div>
    </div>
  )
}
