import { Prisma } from '@prisma/client'

// Database types from Prisma
export type Topic = Prisma.TopicGetPayload<Prisma.TopicDefaultArgs>
export type List = Prisma.ListGetPayload<Prisma.ListDefaultArgs>
export type ListItem = Prisma.ListItemGetPayload<Prisma.ListItemDefaultArgs>
export type Puzzle = Prisma.PuzzleGetPayload<Prisma.PuzzleDefaultArgs>
export type Solve = Prisma.SolveGetPayload<Prisma.SolveDefaultArgs>
export type User = Prisma.UserGetPayload<Prisma.UserDefaultArgs>
export type Session = Prisma.SessionGetPayload<Prisma.SessionDefaultArgs>

// Extended types with relations
export type TopicWithLists = Prisma.TopicGetPayload<{
  include: { lists: true }
}>

export type ListWithItems = Prisma.ListGetPayload<{
  include: { items: true; topic: true }
}>

type BaseListWithItemsAndTopic = Prisma.ListGetPayload<{
  include: {
    items: true
    topic: true
    puzzles: {
      orderBy: { createdAt: 'desc' }
      take: 10 // Get up to 10 most recent puzzles
    }
  }
}>

export type ListWithItemsAndTopic = BaseListWithItemsAndTopic & {
  userSolves?: SolveWithPuzzle[]
}

export type PuzzleWithList = Prisma.PuzzleGetPayload<{
  include: {
    list: {
      include: {
        items: true
        topic: true
      }
    }
  }
}>

export type SolveWithPuzzle = Prisma.SolveGetPayload<{
  select: {
    id: true
    puzzleId: true
    createdAt: true
    updatedAt: true
    completedAt: true
    puzzle: {
      select: {
        id: true
        listId: true
        createdAt: true
        seed: true
      }
    }
  }
}>

// Enums (Prisma 5+ does not export enums on Prisma namespace)
export type ListSource = 'UPLOAD' | 'PASTE' | 'API'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
