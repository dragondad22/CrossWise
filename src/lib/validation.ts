import { z } from 'zod'

// Allowed-character policy for crossword answers (#17): letters A-Z only, after
// uppercasing. Case is the only transformation ever applied — anything else
// (accents, digits, hyphens, spaces) is a hard validation failure, never a
// silent strip, so an invalid word denies the import with an error naming it.
// Shared so the CSV import (#31) applies the identical rule.
export const ANSWER_ALLOWED_PATTERN = /^[A-Z]+$/

export function findDisallowedAnswerCharacters(answer: string): string[] {
  return Array.from(new Set(answer.toUpperCase().replace(/[A-Z]/g, '').split('')))
}

const AnswerSchema = z
  .string()
  .min(2, 'Answer must be at least 2 characters')
  .max(20, 'Answer must be at most 20 characters')
  .transform((val) => val.toUpperCase())
  .superRefine((val, ctx) => {
    if (!ANSWER_ALLOWED_PATTERN.test(val)) {
      const disallowed = findDisallowedAnswerCharacters(val).join(' ')
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Answer "${val}" contains characters that aren't letters A–Z (${disallowed}). Fix this word and try again.`,
      })
    }
  })

// List JSON Schema validation (from PRP section 9.1)
export const ListItemSchema = z.object({
  answer: AnswerSchema,
  clue: z
    .string()
    .min(3, 'Clue must be at least 3 characters')
    .max(200, 'Clue must be at most 200 characters'),
  note: z.string().optional(),
  difficulty: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5), // Numeric format
      z.literal('EASY'),
      z.literal('MEDIUM'),
      z.literal('HARD'), // String format
    ])
    .optional(),
})

const DifficultyInputSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal('EASY'),
  z.literal('MEDIUM'),
  z.literal('HARD'),
])

export const ListItemInputSchema = z.object({
  answer: AnswerSchema,
  clue: z
    .string()
    .min(3, 'Clue must be at least 3 characters')
    .max(200, 'Clue must be at most 200 characters'),
  note: z.string().optional(),
  difficulty: DifficultyInputSchema.optional(),
})

export const ImportListSchema = z.object({
  topic: z.string().min(1, 'Topic name is required'),
  name: z.string().min(1, 'List name is required'),
  version: z.number().int().positive().default(1),
  items: z
    .array(ListItemSchema)
    .min(5, 'List must have at least 5 items for best results')
    .max(250, 'List should not exceed 250 items for optimal generation'),
})

// API validation schemas
export const CreateTopicSchema = z.object({
  name: z.string().min(1, 'Topic name is required').max(100, 'Topic name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .default('#3B82F6'),
  icon: z.string().max(10, 'Icon too long').default('📚'),
})

export const CreateListSchema = z.object({
  topicId: z.string().cuid('Invalid topic ID'),
  name: z.string().min(1, 'List name is required').max(100, 'List name too long'),
  items: z.array(ListItemInputSchema).min(1, 'At least one item is required'),
})

export const UpdateListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100, 'List name too long'),
  version: z.number().int().positive().optional(),
  items: z
    .array(
      ListItemInputSchema.extend({
        id: z.string().cuid('Invalid list item ID').optional(),
      }),
    )
    .min(1, 'At least one item is required'),
})

export const GeneratePuzzleSchema = z.object({
  listId: z.string().cuid('Invalid list ID'),
  gridSize: z
    .object({
      rows: z.number().int().min(9).max(19).optional(),
      cols: z.number().int().min(9).max(19).optional(),
    })
    .optional(),
  seed: z.string().optional(),
})

export const UpdateSolveStateSchema = z.object({
  puzzleId: z.string().cuid('Invalid puzzle ID'),
  state: z.string(), // JSON stringified solve state
  completed: z.boolean().optional(),
})

export const RegisterSchema = z.object({
  email: z
    .string()
    .email('Valid email required')
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
  name: z.string().max(100, 'Name too long').optional(),
})

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Valid email required')
    .transform((val) => val.toLowerCase()),
  password: z.string().min(1, 'Password required'),
})

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Valid email required')
    .transform((val) => val.toLowerCase()),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token required'),
  // Same password policy as RegisterSchema.
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
})

// Validation helper functions
export function validateListJSON(data: unknown) {
  try {
    const result = ImportListSchema.parse(data)

    // Additional validation for answer uniqueness
    const answers = result.items.map((item) => item.answer)
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

    const commonLetters = Array.from(letterCounts.entries()).filter(
      ([, count]) => count >= 2,
    ).length

    if (commonLetters < 3) {
      console.warn('Warning: Few common letters detected. Puzzle generation may be challenging.')
    }

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues ?? (error as unknown as { errors?: typeof error.issues }).errors ?? []
      return {
        success: false,
        errors: issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      }
    }
    return {
      success: false,
      errors: [
        { field: 'general', message: error instanceof Error ? error.message : 'Unknown error' },
      ],
    }
  }
}

// Case is the only permitted normalization. Disallowed characters are a
// validation failure upstream (AnswerSchema) — stripping them here would
// silently corrupt user data (#17).
export function normalizeAnswer(answer: string): string {
  return answer.toUpperCase()
}

export function validateAnswerFormat(answer: string): {
  valid: boolean
  normalized: string
  issues: string[]
} {
  const issues: string[] = []
  const normalized = answer.toUpperCase()

  if (!ANSWER_ALLOWED_PATTERN.test(normalized)) {
    const disallowed = findDisallowedAnswerCharacters(normalized).join(' ')
    issues.push(`Contains characters that aren't letters A–Z (${disallowed})`)
  }

  if (normalized.length < 2) {
    issues.push('Answer too short (minimum 2 letters)')
  } else if (normalized.length > 20) {
    issues.push('Answer too long (maximum 20 letters)')
  }

  return { valid: issues.length === 0, normalized, issues }
}
