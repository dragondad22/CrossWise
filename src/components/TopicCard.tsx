'use client'

import { Topic } from '@/types/database'

interface TopicCardProps {
  topic: Topic & { _count?: { lists: number } }
  onClick?: () => void
}

export default function TopicCard({ topic, onClick }: TopicCardProps) {
  const listCount = topic._count?.lists || 0
  
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4"
      style={{ borderLeftColor: topic.color }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{topic.icon}</span>
          <h3 className="text-lg font-semibold text-gray-800">{topic.name}</h3>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {listCount} lists
        </span>
      </div>
      
      {topic.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {topic.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Created {new Date(topic.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}