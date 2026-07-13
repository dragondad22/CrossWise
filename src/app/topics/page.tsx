'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { useRequireSession } from '@/lib/useRequireSession'
import { Topic } from '@/types/database'
import TopicCard from '@/components/TopicCard'
import CreateTopicModal from '@/components/CreateTopicModal'
import DeleteTopicModal from '@/components/DeleteTopicModal'
import { Button, buttonClasses } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { ErrorBanner } from '@/components/ui/error-banner'
import { useAutosave } from '@/lib/autosave'

export default function TopicsPage() {
  const router = useRouter()
  const {
    topics,
    setTopics,
    selectTopic,
    selectedTopic,
    selectList,
    setLoading,
    setError,
    isLoading,
    error,
    currentPuzzle,
    setPuzzle,
    setSolveState,
    setWon,
    setLists,
  } = useAppStore()
  const { isAuthenticated, isSessionPending } = useRequireSession()
  const { clearSolveState, stopAutosave } = useAutosave()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null)
  const [isDeletingTopic, setIsDeletingTopic] = useState(false)

  const fetchTopics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/topics')

      if (response.status === 401) {
        // Session expired mid-visit — send the visitor through login, never a
        // false "no topics yet" empty state (#82). Deliberately leave isLoading
        // set so the spinner stays up while navigation happens.
        router.replace(`/login?next=${encodeURIComponent('/topics')}`)
        return
      }

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
      setLoading(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error')
      console.error('Failed to fetch topics:', error)
      setLoading(false)
    }
  }, [router, setError, setLoading, setTopics])

  useEffect(() => {
    if (isAuthenticated) {
      void fetchTopics()
    }
  }, [fetchTopics, isAuthenticated])

  const handleCreateTopic = async (data: {
    name: string
    description?: string
    color?: string
    icon?: string
  }) => {
    setLoading(true)

    try {
      const response = await fetch('/api/v1/topics', {
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

  const handleCloseDeleteModal = () => {
    if (isDeletingTopic) return
    setDeletingTopic(null)
  }

  const handleDeleteTopic = async () => {
    if (!deletingTopic) return

    setIsDeletingTopic(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/topics/${deletingTopic.id}`, { method: 'DELETE' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error?.message || 'Failed to delete topic')
        return
      }

      const deletedTopicId: string = result.data?.topicId ?? deletingTopic.id
      const deletedListIds: string[] = result.data?.listIds ?? []
      const deletedPuzzleIds: string[] = result.data?.puzzleIds ?? []

      // Wipe in-memory/autosaved state for every puzzle that just disappeared,
      // so the UI never holds references to deleted puzzles.
      deletedPuzzleIds.forEach((puzzleId) => clearSolveState(puzzleId))

      if (currentPuzzle && deletedListIds.includes(currentPuzzle.listId)) {
        stopAutosave()
        setSolveState(null)
        setPuzzle(null)
        setWon(false)
      }

      setTopics(useAppStore.getState().topics.filter((topic) => topic.id !== deletedTopicId))
      setLists(useAppStore.getState().lists.filter((list) => list.topicId !== deletedTopicId))

      if (selectedTopic?.id === deletedTopicId) {
        selectTopic(null)
        selectList(null)
      }

      setDeletingTopic(null)
    } catch (error) {
      console.error('Failed to delete topic:', error)
      setError('Network error while deleting the topic')
    } finally {
      setIsDeletingTopic(false)
    }
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

        {error && !isLoading && (
          <ErrorBanner
            className="mt-8"
            message={error}
            onRetry={() => void fetchTopics()}
            onDismiss={() => setError(null)}
          />
        )}

        {isSessionPending || (isLoading && topics.length === 0) ? (
          <div className="mt-12 flex flex-col items-center gap-4 py-12" role="status">
            <div
              className="h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
              aria-hidden="true"
            />
            <p className="text-muted-foreground">Loading your topics…</p>
          </div>
        ) : topics.length === 0 && !isLoading ? (
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
              <TopicCard
                key={topic.id}
                topic={topic}
                onClick={() => handleTopicClick(topic)}
                onDelete={() => setDeletingTopic(topic)}
              />
            ))}
          </div>
        )}

        <CreateTopicModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTopic}
        />

        <DeleteTopicModal
          isOpen={deletingTopic !== null}
          topic={deletingTopic}
          isDeleting={isDeletingTopic}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteTopic}
        />
      </div>
    </div>
  )
}
