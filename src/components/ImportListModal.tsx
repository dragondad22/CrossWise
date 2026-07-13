'use client'

import { useState } from 'react'
import type { z } from 'zod'

import { validateListJSON, ListItemSchema } from '@/lib/validation'
import { Topic } from '@/types/database'

interface ImportListModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ImportListSubmission) => void
  topics: Topic[]
}

type ValidatedListItem = z.infer<typeof ListItemSchema>

export interface ImportListSubmission {
  topicId: string
  name: string
  items: ValidatedListItem[]
}

export default function ImportListModal({
  isOpen,
  onClose,
  onSubmit,
  topics,
}: ImportListModalProps) {
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setErrors([])

    try {
      const jsonData = JSON.parse(jsonText)
      const validation = validateListJSON(jsonData)

      if (!validation.success) {
        setErrors(
          validation.errors?.map((err) => `${err.field}: ${err.message}`) || ['Validation failed'],
        )
        setIsValidating(false)
        return
      }

      if (!selectedTopicId) {
        setErrors(['Please select a topic'])
        setIsValidating(false)
        return
      }

      onSubmit({
        topicId: selectedTopicId,
        name: validation.data!.name,
        items: validation.data!.items,
      })

      // Reset form
      setJsonText('')
      setSelectedTopicId('')
      setErrors([])
      onClose()
    } catch {
      setErrors(['Invalid JSON format'])
    }

    setIsValidating(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setJsonText(text)
    }
    reader.readAsText(file)
  }

  const loadSampleData = () => {
    const sampleData = {
      topic: 'Context Engineering',
      name: 'CE Basics',
      version: 1,
      items: [
        { answer: 'PRIMER', clue: 'Short context to orient a model before tasks' },
        { answer: 'SYSTEMPROMPT', clue: 'Top-level instruction guiding model behavior' },
        { answer: 'FEWSHOT', clue: 'Supplying examples to condition outputs' },
        { answer: 'TEMPLATE', clue: 'Reusable prompt structure with slots' },
        { answer: 'GUARDRAILS', clue: 'Constraints to keep outputs safe and on-policy' },
        { answer: 'RETRIEVER', clue: 'Component that fetches relevant docs' },
        { answer: 'CHUNKING', clue: 'Breaking documents into manageable slices' },
      ],
    }
    setJsonText(JSON.stringify(sampleData, null, 2))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Import Word List</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Assign to Topic *
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a topic...</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.icon} {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Upload JSON File</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">JSON Data *</label>
              <button
                type="button"
                onClick={loadSampleData}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Load Sample
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={12}
              placeholder="Paste JSON data or upload file..."
              required
            />
          </div>

          {errors.length > 0 && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3" role="alert">
              <h4 className="mb-1 text-sm font-medium text-red-800">Validation Errors:</h4>
              <ul className="list-inside list-disc text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
            <h4 className="mb-1 text-sm font-medium text-blue-800">Expected Format:</h4>
            <ul className="list-inside list-disc text-xs text-blue-700">
              <li>5-150 items for best results (sweet spot: 10-150)</li>
              <li>Answers: 2-20 characters, letters A-Z only (accents, digits, and punctuation are rejected)</li>
              <li>Clues: 3-200 characters</li>
              <li>Optional: note, difficulty (1-5)</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isValidating}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Import List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
