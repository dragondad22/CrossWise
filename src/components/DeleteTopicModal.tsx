'use client'

import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
import { Topic } from '@/types/database'

interface DeleteTopicModalProps {
  isOpen: boolean
  topic: Topic | null
  isDeleting?: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteTopicModal({
  isOpen,
  topic,
  isDeleting = false,
  onClose,
  onConfirm,
}: DeleteTopicModalProps) {
  if (!topic) return null

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      title={`Delete "${topic.name}"?`}
      description={
        <p>
          This permanently deletes the topic, every word list in it, and every puzzle and solve
          progress created from those lists. This action cannot be undone.
        </p>
      }
      confirmLabel="Delete topic"
      isDeleting={isDeleting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
