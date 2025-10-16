import { Prisma } from '@prisma/client'

// Database types from Prisma
export type Topic = Prisma.TopicGetPayload<{}>
export type List = Prisma.ListGetPayload<{}>
export type ListItem = Prisma.ListItemGetPayload<{}>
export type Puzzle = Prisma.PuzzleGetPayload<{}>
export type Solve = Prisma.SolveGetPayload<{}>
export type User = Prisma.UserGetPayload<{}>
export type Session = Prisma.SessionGetPayload<{}>

// Extended types with relations
export type TopicWithLists = Prisma.TopicGetPayload<{
  include: { lists: true }
}>

export type ListWithItems = Prisma.ListGetPayload<{
  include: { items: true; topic: true }
}>

export type ListWithItemsAndTopic = Prisma.ListGetPayload<{
  include: {
    items: true
    topic: true
    puzzles: {
      orderBy: { createdAt: 'desc' }
      take: 10 // Get up to 10 most recent puzzles
    }
  }
}>

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
  include: { puzzle: true }
}>

// Enums
export type ListSource = Prisma.ListSource
export type Difficulty = Prisma.Difficulty
