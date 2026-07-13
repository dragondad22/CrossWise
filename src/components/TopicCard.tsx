import { format } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Topic } from '@/types/database'

interface TopicCardProps {
  topic: Topic & { _count?: { lists: number } }
  onClick?: () => void
  onDelete?: () => void
}

export default function TopicCard({ topic, onClick, onDelete }: TopicCardProps) {
  const listCount = topic._count?.lists ?? 0
  const createdAt = topic.createdAt ? format(new Date(topic.createdAt), 'MMM d, yyyy') : ''

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.()
        }
      }}
      className={cn(
        'group h-full cursor-pointer border border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card',
      )}
      style={{ borderColor: topic.color ?? undefined }}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-none px-6 pb-3 pt-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-3xl"
            aria-hidden="true"
            style={{ backgroundColor: `${topic.color}12` }}
          >
            {topic.icon || '📚'}
          </span>
          <div>
            <CardTitle className="text-xl">{topic.name}</CardTitle>
            <CardDescription>
              Created {createdAt} · <span className="font-medium text-foreground">{listCount}</span>{' '}
              list
              {listCount === 1 ? '' : 's'}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Topic</Badge>
          {onDelete && (
            <button
              type="button"
              aria-label={`Delete topic ${topic.name}`}
              onClick={(event) => {
                // The whole card is a navigation button — the delete control must
                // not also trigger it.
                event.preventDefault()
                event.stopPropagation()
                onDelete()
              }}
              onKeyDown={(event) => event.stopPropagation()}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7"
                />
              </svg>
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
        <p className="min-h-[3rem]">
          {topic.description || 'Add a description so teammates know what belongs here.'}
        </p>
        <span
          className="inline-flex w-fit items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          style={{ color: topic.color || undefined }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: topic.color || '#2563eb' }}
          />
          {topic.color ? 'Custom colour' : 'Default colour'}
        </span>
      </CardContent>
    </Card>
  )
}
