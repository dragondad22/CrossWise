'use client'

import { ListWithItemsAndTopic } from '@/types/database'

interface ListCardProps {
  list: ListWithItemsAndTopic
  onNewGame?: () => void
  onEdit?: () => void
  onExport?: () => void
  onDuplicate?: () => void
}

export default function ListCard({ list, onNewGame, onEdit, onExport, onDuplicate }: ListCardProps) {
  const itemCount = list.items.length
  const hasRecentPuzzle = list.puzzles.length > 0
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{list.name}</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              v{list.version}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">
              {itemCount} terms
            </span>
            {list.topic && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs">{list.topic.icon}</span>
                  <span className="text-sm text-gray-600">{list.topic.name}</span>
                </div>
              </>
            )}
          </div>
          
          {hasRecentPuzzle && (
            <div className="text-xs text-green-600 mb-3">
              ✓ Recent puzzle available
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Updated {new Date(list.updatedAt).toLocaleDateString()}
        </div>
        
        <div className="flex gap-2">
          {onNewGame && (
            <button
              onClick={onNewGame}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              New Game
            </button>
          )}
          
          <div className="relative group">
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="py-1">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                )}
                {onDuplicate && (
                  <button
                    onClick={onDuplicate}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Duplicate
                  </button>
                )}
                {onExport && (
                  <button
                    onClick={onExport}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}