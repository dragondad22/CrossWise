'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Topic, ListWithItemsAndTopic } from '@/types/database'
import ListCard from '@/components/ListCard'
import ImportListModal from '@/components/ImportListModal'

export default function ListsPage() {
  const router = useRouter()
  const params = useParams()
  const topicId = params.id as string
  
  const { 
    selectedTopic, 
    lists, 
    setLists, 
    selectTopic, 
    selectList, 
    setLoading, 
    setError,
    topics
  } = useAppStore()
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [filteredLists, setFilteredLists] = useState<ListWithItemsAndTopic[]>([])
  
  useEffect(() => {
    if (topicId) {
      fetchTopicAndLists(topicId)
    }
  }, [topicId])
  
  useEffect(() => {
    // Filter lists for current topic
    const currentTopicLists = lists.filter(list => list.topicId === topicId)
    setFilteredLists(currentTopicLists)
  }, [lists, topicId])
  
  const fetchTopicAndLists = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch topic details
      const topicResponse = await fetch(`/api/topics/${id}`)
      const topicResult = await topicResponse.json()
      
      if (topicResult.success) {
        selectTopic(topicResult.data)
      }
      
      // Fetch lists for this topic
      const listsResponse = await fetch(`/api/lists?topicId=${id}`)
      const listsResult = await listsResponse.json()
      
      if (listsResult.success) {
        setLists(listsResult.data)
      } else {
        setError(listsResult.error?.message || 'Failed to fetch lists')
      }
    } catch (error) {
      setError('Network error')
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleImportList = async (data: { topicId: string; name: string; items: any[] }) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchTopicAndLists(topicId) // Refresh
      } else {
        setError(result.error?.message || 'Failed to import list')
      }
    } catch (error) {
      setError('Network error')
      console.error('Failed to import list:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleNewGame = async (list: ListWithItemsAndTopic) => {
    selectList(list)
    
    try {
      setLoading(true)
      
      const response = await fetch('/api/puzzles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listId: list.id,
          seed: `${Date.now()}_${list.id}`
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Navigate to solve page
        router.push(`/solve/${result.data.puzzleId}`)
      } else {
        setError(result.error?.message || 'Failed to generate puzzle')
      }
    } catch (error) {
      setError('Network error')
      console.error('Failed to generate puzzle:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleExportList = async (list: ListWithItemsAndTopic) => {
    try {
      const response = await fetch(`/api/lists/${list.id}/export`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${list.name.replace(/[^a-zA-Z0-9]/g, '_')}_v${list.version}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        setError('Failed to export list')
      }
    } catch (error) {
      setError('Network error')
      console.error('Failed to export list:', error)
    }
  }
  
  if (!selectedTopic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/topics')}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedTopic.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{selectedTopic.name}</h1>
              {selectedTopic.description && (
                <p className="text-gray-600">{selectedTopic.description}</p>
              )}
            </div>
          </div>
          
          <div className="ml-auto">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Import List
            </button>
          </div>
        </div>
        
        {filteredLists.length === 0 && !useAppStore.getState().isLoading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No lists yet</h2>
            <p className="text-gray-500 mb-4">
              Import your first word list to start creating crosswords
            </p>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Import Your First List
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onNewGame={() => handleNewGame(list)}
                onExport={() => handleExportList(list)}
              />
            ))}
          </div>
        )}
        
        <ImportListModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSubmit={(data) => handleImportList({ ...data, topicId })}
          topics={topics}
        />
      </div>
    </div>
  )
}