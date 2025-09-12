'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Topic } from '@/types/database'
import TopicCard from '@/components/TopicCard'
import CreateTopicModal from '@/components/CreateTopicModal'

export default function TopicsPage() {
  const router = useRouter()
  const { topics, setTopics, selectTopic, setLoading, setError } = useAppStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  useEffect(() => {
    fetchTopics()
  }, [])
  
  const fetchTopics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/topics')
      const result = await response.json()
      
      if (result.success) {
        setTopics(result.data)
      } else {
        setError(result.error?.message || 'Failed to fetch topics')
      }
    } catch (error) {
      setError('Network error')
      console.error('Failed to fetch topics:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateTopic = async (data: { name: string; description?: string; color?: string; icon?: string }) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchTopics() // Refresh the list
      } else {
        setError(result.error?.message || 'Failed to create topic')
      }
    } catch (error) {
      setError('Network error')
      console.error('Failed to create topic:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleTopicClick = (topic: Topic) => {
    selectTopic(topic)
    router.push(`/topics/${topic.id}/lists`)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Topics</h1>
            <p className="text-gray-600">Organize your word lists by subject matter</p>
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Topic
          </button>
        </div>
        
        {topics.length === 0 && !useAppStore.getState().isLoading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No topics yet</h2>
            <p className="text-gray-500 mb-4">
              Create your first topic to start organizing word lists
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Create Your First Topic
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onClick={() => handleTopicClick(topic)}
              />
            ))}
          </div>
        )}
        
        <CreateTopicModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTopic}
        />
      </div>
    </div>
  )
}