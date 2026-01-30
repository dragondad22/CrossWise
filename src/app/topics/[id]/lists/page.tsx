'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { ListWithItemsAndTopic } from '@/types/database'
import ListCard from '@/components/ListCard'
import ImportListModal, { ImportListSubmission } from '@/components/ImportListModal'
import EditListModal from '@/components/EditListModal'
import DeleteListModal from '@/components/DeleteListModal'
import { Button, buttonClasses } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { useAutosave } from '@/lib/autosave'

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
    currentPuzzle,
    setPuzzle,
    setSolveState,
    setWon,
    setLoading,
    setError,
    topics,
    isLoading,
  } = useAppStore()

  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [filteredLists, setFilteredLists] = useState<ListWithItemsAndTopic[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingList, setEditingList] = useState<ListWithItemsAndTopic | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingList, setDeletingList] = useState<ListWithItemsAndTopic | null>(null)
  const [isDeletingList, setIsDeletingList] = useState(false)
  const { clearSolveState, stopAutosave } = useAutosave()

  const fetchTopicAndLists = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)

      try {
        // Fetch topic details
        const topicResponse = await fetch(`/api/v1/topics/${id}`)
        const topicResult = await topicResponse.json()

        if (topicResult.success) {
          selectTopic(topicResult.data)
        }

        // Fetch lists for this topic
        const listsResponse = await fetch(`/api/v1/lists?topicId=${id}`)
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
    },
    [selectTopic, setError, setLists, setLoading],
  )

  useEffect(() => {
    if (topicId) {
      void fetchTopicAndLists(topicId)
    }
  }, [fetchTopicAndLists, topicId])

  useEffect(() => {
    // Filter lists for current topic
    const currentTopicLists = lists.filter((list) => list.topicId === topicId)
    setFilteredLists(currentTopicLists)
  }, [lists, topicId])

  const handleImportList = async (data: ImportListSubmission) => {
    setLoading(true)

    try {
      const response = await fetch('/api/v1/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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

  const handleOpenEditModal = (list: ListWithItemsAndTopic) => {
    setEditingList(list)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingList(null)
  }

  const handleUpdateList = async (payload: {
    name: string
    version?: number
    items: Array<{
      id?: string
      answer: string
      clue: string
      note?: string
      difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    }>
  }): Promise<string | null> => {
    if (!editingList) {
      return 'No list selected'
    }

    setIsSavingEdit(true)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/lists/${editingList.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const text = await response.text()
      let result

      try {
        result = JSON.parse(text)
      } catch (parseError) {
        console.error('Failed to parse update response:', parseError, text)
        setError('Invalid response from server')
        return 'Invalid response from server'
      }

      if (response.ok && result.success) {
        const updatedList = result.data as ListWithItemsAndTopic
        const currentLists = useAppStore.getState().lists
        const nextLists = currentLists.map((list) =>
          list.id === updatedList.id ? updatedList : list,
        )
        setLists(nextLists)

        const currentSelectedList = useAppStore.getState().selectedList
        if (currentSelectedList?.id === updatedList.id) {
          selectList(updatedList)
        }

        setIsEditModalOpen(false)
        setEditingList(null)
        return null
      }

      const message =
        result?.error?.details?.length > 0
          ? result.error.details
              .map((detail: { field?: string; message: string }) =>
                detail.field ? `${detail.field}: ${detail.message}` : detail.message,
              )
              .join(', ')
          : result?.error?.message || 'Failed to update list'

      setError(message)
      return message
    } catch (error) {
      console.error('Failed to update list:', error)
      const message = 'Network error while updating the list'
      setError(message)
      return message
    } finally {
      setIsSavingEdit(false)
      setLoading(false)
    }
  }

  const handleOpenDeleteModal = (list: ListWithItemsAndTopic) => {
    setDeletingList(list)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    if (isDeletingList) return
    setIsDeleteModalOpen(false)
    setDeletingList(null)
  }

  const handleDeleteList = async () => {
    if (!deletingList) {
      return
    }

    setIsDeletingList(true)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/lists/${deletingList.id}`, {
        method: 'DELETE',
      })

      const text = await response.text()
      let result: { success?: boolean; data?: { listId: string; puzzleIds: string[] }; error?: { message?: string } }

      try {
        result = JSON.parse(text)
      } catch (parseError) {
        console.error('Failed to parse delete response:', parseError, text)
        setError('Invalid response from server')
        return
      }

      if (!response.ok || !result.success) {
        setError(result.error?.message || 'Failed to delete list')
        return
      }

      const deletedListId = result.data?.listId ?? deletingList.id
      const puzzleIds = result.data?.puzzleIds ?? []

      puzzleIds.forEach((puzzleId) => clearSolveState(puzzleId))

      if (currentPuzzle?.listId === deletedListId) {
        stopAutosave()
        setSolveState(null)
        setPuzzle(null)
        setWon(false)
      }

      const nextLists = useAppStore.getState().lists.filter((list) => list.id !== deletedListId)
      setLists(nextLists)

      const currentSelectedList = useAppStore.getState().selectedList
      if (currentSelectedList?.id === deletedListId) {
        selectList(null)
      }

      setIsDeleteModalOpen(false)
      setDeletingList(null)
    } catch (error) {
      console.error('Failed to delete list:', error)
      setError('Network error while deleting list')
    } finally {
      setIsDeletingList(false)
      setLoading(false)
    }
  }

  const handleNewGame = async (list: ListWithItemsAndTopic) => {
    selectList(list)

    try {
      setLoading(true)

      const response = await fetch('/api/v1/puzzles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listId: list.id,
          seed: `${Date.now()}_${list.id}`,
        }),
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
      const response = await fetch(`/api/v1/lists/${list.id}/export`)

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading topic…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push('/topics')}
              className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'px-3 py-2' })}
            >
              ← Topics
            </button>
            <div>
              <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <span aria-hidden="true" className="text-2xl">
                  {selectedTopic.icon}
                </span>
                {selectedTopic.name}
              </div>
              {selectedTopic.description && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {selectedTopic.description}
                </p>
              )}
            </div>
          </div>

          <Button onClick={() => setIsImportModalOpen(true)} className="w-full md:w-auto">
            <span aria-hidden="true">＋</span> Import list
          </Button>
        </div>

        {filteredLists.length === 0 && !isLoading ? (
          <Card className="mt-12">
            <CardContent className="py-12 text-center">
              <div className="text-5xl">📝</div>
              <CardTitle className="mt-4 text-2xl">No lists yet</CardTitle>
              <CardDescription className="mx-auto mt-2 max-w-md">
                Import or create a word list to generate your first crossword. We&apos;ll keep every
                puzzle you build tied to this topic.
              </CardDescription>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className={buttonClasses({ className: 'mt-6 px-6 py-3 text-base' })}
              >
                Import your first list
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredLists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onNewGame={() => handleNewGame(list)}
                onEdit={() => handleOpenEditModal(list)}
                onExport={() => handleExportList(list)}
                onDelete={() => handleOpenDeleteModal(list)}
                onRefresh={() => fetchTopicAndLists(topicId)}
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
        <EditListModal
          isOpen={isEditModalOpen}
          list={editingList}
          isSaving={isSavingEdit}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateList}
        />
        <DeleteListModal
          isOpen={isDeleteModalOpen}
          list={deletingList}
          isDeleting={isDeletingList}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteList}
        />
      </div>
    </div>
  )
}
