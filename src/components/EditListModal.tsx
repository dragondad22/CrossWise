'use client'

import { useEffect, useMemo, useState } from 'react'
import { ListWithItemsAndTopic } from '@/types/database'

type DifficultyOption = 'EASY' | 'MEDIUM' | 'HARD'

type EditableListItem = {
  id?: string
  tempId: string
  answer: string
  clue: string
  note: string
  difficulty: DifficultyOption
}

interface EditListModalProps {
  isOpen: boolean
  list: ListWithItemsAndTopic | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: {
    name: string
    version?: number
    items: Array<{
      id?: string
      answer: string
      clue: string
      note?: string
      difficulty: DifficultyOption
    }>
  }) => Promise<string | null>
}

function generateTempId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 11)
}

export default function EditListModal({
  isOpen,
  list,
  isSaving,
  onClose,
  onSubmit,
}: EditListModalProps) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState<string>('')
  const [items, setItems] = useState<EditableListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isAddWordOpen, setIsAddWordOpen] = useState(false)

  const topicLabel = useMemo(() => {
    if (!list?.topic) return ''
    return `${list.topic.icon} ${list.topic.name}`
  }, [list])

  useEffect(() => {
    if (!isOpen || !list) return

    setName(list.name)
    setVersion(list.version ? String(list.version) : '')
    setItems(
      list.items.map((item) => ({
        id: item.id,
        tempId: item.id,
        answer: item.answer,
        clue: item.clue,
        note: item.note ?? '',
        difficulty: (item.difficulty as DifficultyOption | null) ?? 'MEDIUM',
      })),
    )
    setError(null)
  }, [isOpen, list])

  const handleAddItem = (item: Omit<EditableListItem, 'tempId'>) => {
    setItems((prev) => [
      {
        tempId: generateTempId(),
        ...item,
      },
      ...prev,
    ])
  }

  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId))
  }

  const updateItem = (tempId: string, field: keyof EditableListItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item
        if (field === 'answer') {
          const sanitized = value.toUpperCase().replace(/[^A-Z]/g, '')
          return { ...item, answer: sanitized }
        }
        if (field === 'difficulty') {
          return { ...item, difficulty: value as DifficultyOption }
        }
        if (field === 'note') {
          return { ...item, note: value }
        }
        if (field === 'clue') {
          return { ...item, clue: value }
        }
        return { ...item, [field]: value }
      }),
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('List name is required.')
      return
    }

    if (items.length === 0) {
      setError('Add at least one word before saving.')
      return
    }

    const invalidItem = items.find(
      (item) => item.answer.trim().length < 2 || item.clue.trim().length < 3,
    )

    if (invalidItem) {
      setError('Each item needs an answer (min 2 letters) and a clue (min 3 characters).')
      return
    }

    const versionValue = version.trim()
    let parsedVersion: number | undefined
    if (versionValue) {
      const numericVersion = Number(versionValue)
      if (!Number.isInteger(numericVersion) || numericVersion <= 0) {
        setError('Version must be a positive whole number.')
        return
      }
      parsedVersion = numericVersion
    }

    const payload = {
      name: trimmedName,
      version: parsedVersion,
      items: items.map((item) => ({
        id: item.id,
        answer: item.answer.trim(),
        clue: item.clue.trim(),
        note: item.note.trim() ? item.note.trim() : undefined,
        difficulty: item.difficulty,
      })),
    }

    const result = await onSubmit(payload)
    if (result) {
      setError(result)
    }
  }

  if (!isOpen || !list) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Word List</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update the list name, adjust clues, and manage the words in this set.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">List name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="List name"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Version</span>
              <input
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number"
                min={1}
                placeholder="1"
              />
            </label>
          </div>

          {topicLabel && (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">Topic:</span> {topicLabel}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Words &amp; clues</h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddWordOpen(true)
                  setError(null)
                }}
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
              >
                + Add word
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.tempId}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">
                      Entry {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.tempId)}
                      className="text-sm text-red-500 transition hover:text-red-600"
                      disabled={items.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-gray-700">Answer</span>
                      <input
                        value={item.answer}
                        onChange={(event) =>
                          updateItem(item.tempId, 'answer', event.target.value)
                        }
                        className="rounded-md border border-gray-300 px-3 py-2 text-base uppercase focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="E.g. ORBIT"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-gray-700">Difficulty</span>
                      <select
                        value={item.difficulty}
                        onChange={(event) =>
                          updateItem(item.tempId, 'difficulty', event.target.value)
                        }
                        className="rounded-md border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </label>
                  </div>
                  <label className="mt-3 flex flex-col gap-1 text-sm">
                    <span className="font-medium text-gray-700">Clue</span>
                    <textarea
                      value={item.clue}
                      onChange={(event) => updateItem(item.tempId, 'clue', event.target.value)}
                      className="min-h-[60px] rounded-md border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Write an engaging clue..."
                      required
                    />
                  </label>
                  <label className="mt-3 flex flex-col gap-1 text-sm">
                    <span className="font-medium text-gray-700">Note (optional)</span>
                    <textarea
                      value={item.note}
                      onChange={(event) => updateItem(item.tempId, 'note', event.target.value)}
                      className="min-h-[50px] rounded-md border border-gray-200 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Context or teaching tips"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      <AddWordModal
        isOpen={isAddWordOpen}
        onClose={() => setIsAddWordOpen(false)}
        onSubmit={(newItem) => {
          handleAddItem({
            answer: newItem.answer,
            clue: newItem.clue,
            note: newItem.note ?? '',
            difficulty: newItem.difficulty,
          })
          setIsAddWordOpen(false)
          setError(null)
        }}
      />
    </div>
  )
}

interface AddWordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (item: {
    answer: string
    clue: string
    note?: string
    difficulty: DifficultyOption
  }) => void
}

function AddWordModal({ isOpen, onClose, onSubmit }: AddWordModalProps) {
  const [answer, setAnswer] = useState('')
  const [clue, setClue] = useState('')
  const [note, setNote] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyOption>('MEDIUM')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setAnswer('')
    setClue('')
    setNote('')
    setDifficulty('MEDIUM')
    setError(null)
  }, [isOpen])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedAnswer = answer.trim().toUpperCase().replace(/[^A-Z]/g, '')
    const trimmedClue = clue.trim()
    const trimmedNote = note.trim()

    if (trimmedAnswer.length < 2) {
      setError('Answer must be at least 2 letters.')
      return
    }

    if (trimmedClue.length < 3) {
      setError('Clue must be at least 3 characters.')
      return
    }

    onSubmit({
      answer: trimmedAnswer,
      clue: trimmedClue,
      note: trimmedNote ? trimmedNote : undefined,
      difficulty,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add new word</h3>
              <p className="text-sm text-gray-500">
                Provide the answer and clue details for this list entry.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Answer</span>
            <input
              value={answer}
              onChange={(event) => {
                const sanitized = event.target.value.toUpperCase().replace(/[^A-Z]/g, '')
                setAnswer(sanitized)
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-base uppercase focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E.g. ORBIT"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Clue</span>
            <textarea
              value={clue}
              onChange={(event) => setClue(event.target.value)}
              className="min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write the clue that matches this answer…"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Difficulty</span>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as DifficultyOption)}
              className="rounded-md border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Note (optional)</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-[60px] rounded-md border border-gray-200 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any teaching tips or context to remember later"
            />
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add word
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
