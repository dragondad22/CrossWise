import { z } from 'zod'

// List JSON Schema validation (from PRP section 9.1)
export const ListItemSchema = z.object({
  answer: z.string()
    .min(2, 'Answer must be at least 2 characters')
    .max(20, 'Answer must be at most 20 characters')
    .transform((val) => val.toUpperCase().replace(/[^A-Z]/g, '')), // A-Z only, uppercase
  clue: z.string()
    .min(3, 'Clue must be at least 3 characters')
    .max(200, 'Clue must be at most 200 characters'),
  note: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional()
})

export const ImportListSchema = z.object({
  topic: z.string().min(1, 'Topic name is required'),
  name: z.string().min(1, 'List name is required'),
  version: z.number().int().positive().default(1),
  items: z.array(ListItemSchema)
    .min(5, 'List must have at least 5 items for best results')
    .max(50, 'List should not exceed 50 items for optimal generation')
})

// API validation schemas
export const CreateTopicSchema = z.object({
  name: z.string()
    .min(1, 'Topic name is required')
    .max(100, 'Topic name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#3B82F6'),
  icon: z.string().max(10, 'Icon too long').default('📚')
})

export const CreateListSchema = z.object({
  topicId: z.string().cuid('Invalid topic ID'),
  name: z.string()
    .min(1, 'List name is required')
    .max(100, 'List name too long'),
  items: z.array(z.object({
    answer: z.string()
      .min(2, 'Answer must be at least 2 characters')
      .max(20, 'Answer must be at most 20 characters'),
    clue: z.string()
      .min(3, 'Clue must be at least 3 characters')
      .max(200, 'Clue must be at most 200 characters'),
    note: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional()
  })).min(1, 'At least one item is required')
})

export const GeneratePuzzleSchema = z.object({
  listId: z.string().cuid('Invalid list ID'),
  gridSize: z.object({
    rows: z.number().int().min(9).max(19).optional(),
    cols: z.number().int().min(9).max(19).optional()
  }).optional(),
  seed: z.string().optional()
})

export const UpdateSolveStateSchema = z.object({
  puzzleId: z.string().cuid('Invalid puzzle ID'),
  state: z.string(), // JSON stringified solve state
  completed: z.boolean().optional()
})

// Validation helper functions
export function validateListJSON(data: unknown) {
  try {
    const result = ImportListSchema.parse(data)
    
    // Additional validation for answer uniqueness
    const answers = result.items.map(item => item.answer)
    const uniqueAnswers = new Set(answers)
    if (answers.length !== uniqueAnswers.size) {
      throw new Error('Duplicate answers found in list')
    }
    
    // Check for minimum viable intersections
    const letterCounts = new Map<string, number>()
    for (const answer of answers) {
      for (const letter of answer) {
        letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1)
      }
    }
    
    const commonLetters = Array.from(letterCounts.entries())
      .filter(([_, count]) => count >= 2)
      .length
    
    if (commonLetters < 3) {
      console.warn('Warning: Few common letters detected. Puzzle generation may be challenging.')
    }
    
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    return {
      success: false,
      errors: [{ field: 'general', message: error instanceof Error ? error.message : 'Unknown error' }]
    }
  }
}

export function normalizeAnswer(answer: string): string {
  return answer.toUpperCase().replace(/[^A-Z]/g, '')
}

export function validateAnswerFormat(answer: string): { valid: boolean; normalized: string; issues: string[] } {
  const issues: string[] = []
  let normalized = answer.toUpperCase()
  
  // Remove non-letter characters and track what was removed
  const originalLength = normalized.length
  normalized = normalized.replace(/[^A-Z]/g, '')
  
  if (normalized.length !== originalLength) {
    issues.push('Non-letter characters removed')
  }
  
  if (normalized.length < 2) {
    issues.push('Answer too short (minimum 2 letters)')
    return { valid: false, normalized, issues }
  }
  
  if (normalized.length > 20) {
    issues.push('Answer too long (maximum 20 letters)')
    return { valid: false, normalized, issues }
  }
  
  return { valid: issues.length === 0, normalized, issues }
}