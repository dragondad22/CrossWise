import Link from 'next/link'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonClasses } from '@/components/ui/button'
import { ListWithItemsAndTopic } from '@/types/database'

interface ListCardProps {
  list: ListWithItemsAndTopic
  onNewGame?: () => void
  onEdit?: () => void
  onExport?: () => void
  onDuplicate?: () => void
}

export default function ListCard({
  list,
  onNewGame,
  onEdit,
  onExport,
  onDuplicate,
}: ListCardProps) {
  const itemCount = list.items.length
  const puzzles = list.puzzles || []
  const hasRecentPuzzle = puzzles.length > 0

  return (
    <Card className="flex h-full flex-col border border-border/70 shadow-card/20 transition hover:-translate-y-0.5 hover:shadow-card">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{list.name}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
              <span>{itemCount} terms</span>
              {list.topic && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <span aria-hidden="true">{list.topic.icon}</span>
                    {list.topic.name}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant="outline">v{list.version}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {hasRecentPuzzle ? (
          <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
              Recent puzzles
            </p>
            <div className="mt-2 space-y-1.5">
              {puzzles.slice(0, 3).map((puzzle, index) => (
                <Link
                  key={puzzle.id}
                  href={`/solve/${puzzle.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1 text-sm text-primary transition hover:bg-primary/10"
                >
                  <span className="font-medium">Puzzle {index + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(puzzle.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              ))}
              {puzzles.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{puzzles.length - 3} more saved puzzle{puzzles.length - 3 === 1 ? '' : 's'}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p>
            No saved puzzles yet. Generate a new crossword anytime and your progress will appear
            here.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70">
        <span className="text-xs text-muted-foreground">
          Updated {new Date(list.updatedAt).toLocaleDateString()}
        </span>
        <div className="flex flex-wrap gap-2">
          {onNewGame && (
            <Button onClick={onNewGame} size="sm">
              New game
            </Button>
          )}
          {onEdit && (
            <button onClick={onEdit} className={buttonClasses({ variant: 'outline', size: 'sm' })}>
              Edit
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className={buttonClasses({ variant: 'outline', size: 'sm' })}
            >
              Duplicate
            </button>
          )}
          {onExport && (
            <button onClick={onExport} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
              Export
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
