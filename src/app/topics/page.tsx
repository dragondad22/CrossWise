'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Topic } from '@/types/database'
import TopicCard from '@/components/TopicCard'
import CreateTopicModal from '@/components/CreateTopicModal'
import { Button, buttonClasses } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'

export default function TopicsPage() {
  const router = useRouter()
  const { topics, setTopics, selectTopic, setLoading, setError, isLoading } = useAppStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchTopics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/topics')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      let result

      try {
        result = JSON.parse(text)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Response text:', text)
        throw new Error('Invalid JSON response from server')
      }

      if (result.success) {
        setTopics(result.data)
      } else {
        setError(result.error?.message || 'Failed to fetch topics')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error')
      console.error('Failed to fetch topics:', error)
    } finally {
      setLoading(false)
    }
  }, [setError, setLoading, setTopics])

  useEffect(() => {
    void fetchTopics()
  }, [fetchTopics])

  const handleCreateTopic = async (data: {
    name: string
    description?: string
    color?: string
    icon?: string
  }) => {
    setLoading(true)

    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      let result

      try {
        result = JSON.parse(text)
      } catch (parseError) {
        console.error('JSON parse error on create topic:', parseError)
        console.error('Response text:', text)
        throw new Error('Invalid JSON response from server')
      }

      if (result.success) {
        await fetchTopics() // Refresh the list
      } else {
        setError(result.error?.message || 'Failed to create topic')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error')
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
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-3xl font-semibold text-foreground md:text-4xl">Your topics</h1>
            <p className="text-base text-muted-foreground">
              Collect terms by subject, then open any list to spin up a fresh crossword in seconds.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full justify-center md:w-auto"
          >
            <span aria-hidden="true">＋</span> New topic
          </Button>
        </div>

        {topics.length === 0 && !isLoading ? (
          <Card className="mt-12">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <span className="text-5xl">📚</span>
              <CardTitle className="text-2xl">No topics yet</CardTitle>
              <CardDescription className="max-w-md">
                Start by creating your first topic. Once you import a list, you can generate and
                save games for your learners.
              </CardDescription>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className={buttonClasses({ className: 'px-6 py-3 text-base' })}
              >
                Create your first topic
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} onClick={() => handleTopicClick(topic)} />
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
