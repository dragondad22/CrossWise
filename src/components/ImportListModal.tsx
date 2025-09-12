'use client'

import { useState } from 'react'
import { validateListJSON } from '@/lib/validation'
import { Topic } from '@/types/database'

interface ImportListModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { topicId: string; name: string; items: any[] }) => void
  topics: Topic[]
}

export default function ImportListModal({ isOpen, onClose, onSubmit, topics }: ImportListModalProps) {
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
        setErrors(validation.errors?.map(err => `${err.field}: ${err.message}`) || ['Validation failed'])
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
        items: validation.data!.items
      })
      
      // Reset form
      setJsonText('')
      setSelectedTopicId('')
      setErrors([])
      onClose()
    } catch (error) {
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
      "topic": "Context Engineering",
      "name": "CE Basics",
      "version": 1,
      "items": [
        { "answer": "PRIMER", "clue": "Short context to orient a model before tasks" },
        { "answer": "SYSTEMPROMPT", "clue": "Top-level instruction guiding model behavior" },
        { "answer": "FEWSHOT", "clue": "Supplying examples to condition outputs" },
        { "answer": "TEMPLATE", "clue": "Reusable prompt structure with slots" },
        { "answer": "GUARDRAILS", "clue": "Constraints to keep outputs safe and on-policy" },
        { "answer": "RETRIEVER", "clue": "Component that fetches relevant docs" },
        { "answer": "CHUNKING", "clue": "Breaking documents into manageable slices" }
      ]
    }
    setJsonText(JSON.stringify(sampleData, null, 2))
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Import Word List</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Topic *
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                JSON Data *
              </label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={12}
              placeholder="Paste JSON data or upload file..."
              required
            />
          </div>
          
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-1">Validation Errors:</h4>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Expected Format:</h4>
            <ul className="text-xs text-blue-700 list-disc list-inside">
              <li>5-50 items for best results (sweet spot: 10-25)</li>
              <li>Answers: 2-20 characters, A-Z only (auto-converted)</li>
              <li>Clues: 3-200 characters</li>
              <li>Optional: note, difficulty (1-5)</li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isValidating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Import List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}