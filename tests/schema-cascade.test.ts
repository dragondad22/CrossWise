import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Deleting a topic or list relies entirely on Prisma referential actions to
// remove children (#15/#16): the routes delete a single row and trust the
// cascade to leave no orphans. This contract lives in the schema, so guard it
// here — losing one of these `onDelete: Cascade` declarations would silently
// start orphaning rows (or failing deletes) in production.
describe('prisma schema cascade contract (#15/#16)', () => {
  const schema = readFileSync(join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8')

  const modelBlock = (name: string) => {
    const match = schema.match(new RegExp(`model ${name} \\{[\\s\\S]*?\\n\\}`, 'm'))
    expect(match, `model ${name} missing from schema`).toBeTruthy()
    return match![0]
  }

  const relationCascades = (model: string, relationTarget: string) => {
    const block = modelBlock(model)
    const line = block
      .split('\n')
      .find((l) => l.includes(`${relationTarget} `) && l.includes('@relation'))
    expect(line, `${model} -> ${relationTarget} relation missing`).toBeTruthy()
    expect(line, `${model} -> ${relationTarget} must declare onDelete: Cascade`).toContain(
      'onDelete: Cascade',
    )
  }

  it('List cascades from Topic', () => relationCascades('List', 'Topic'))
  it('ListItem cascades from List', () => relationCascades('ListItem', 'List'))
  it('Puzzle cascades from List', () => relationCascades('Puzzle', 'List'))
  it('Solve cascades from Puzzle', () => relationCascades('Solve', 'Puzzle'))
})
