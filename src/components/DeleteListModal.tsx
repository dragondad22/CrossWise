'use client'

import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
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
  if (!list) return null

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      title={`Delete "${list.name}"?`}
      description={
        <p>
          This permanently deletes the word list and every puzzle created from it. This action
          cannot be undone.
        </p>
      }
      confirmLabel="Delete list"
      isDeleting={isDeleting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
