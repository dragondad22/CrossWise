import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import { AutosaveManager, autosaveManager, useAutosave } from '../autosave'
import type { SolveState } from '@/types/crossword'

const createSolveState = (): SolveState => ({
  filledCells: { '0,0': 'A' },
  selectedCell: { row: 0, col: 0 },
  startTime: new Date('2024-01-01T10:00:00Z'),
  checkResults: {},
})

type OnSaveCallback = NonNullable<Parameters<AutosaveManager['startAutosave']>[2]>['onSave']

describe('AutosaveManager', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('saves immediately and on intervals, syncing to server once per tick', async () => {
    vi.useFakeTimers()
    const manager = new AutosaveManager()
    const state = createSolveState()
    const onServerSave = vi.fn().mockResolvedValue(undefined)

    manager.startAutosave('puzzle-1', () => state, { onSave: onServerSave })

    await Promise.resolve()
    expect(onServerSave).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('crosswise_solve_puzzle-1')).toBeTruthy()

    await vi.advanceTimersByTimeAsync(5000)
    expect(onServerSave).toHaveBeenCalledTimes(2)

    manager.stopAutosave()
  })

  it('restores saved state and converts persisted dates', () => {
    const stored = JSON.stringify({
      ...createSolveState(),
      startTime: new Date('2024-01-01T11:00:00Z').toISOString(),
      endTime: new Date('2024-01-01T11:30:00Z').toISOString(),
      lastSaved: new Date('2024-01-01T11:31:00Z').toISOString(),
    })
    localStorage.setItem('crosswise_solve_puzzle-2', stored)

    const manager = new AutosaveManager()
    const restored = manager.loadSolveState('puzzle-2')

    expect(restored).not.toBeNull()
    expect(restored?.startTime).toBeInstanceOf(Date)
    expect(restored?.endTime).toBeInstanceOf(Date)
  })

  it('cleans up old saves and keeps recent entries sorted by recency', () => {
    const manager = new AutosaveManager()

    localStorage.setItem(
      'crosswise_solve_old',
      JSON.stringify({ lastSaved: new Date('2023-01-01T00:00:00Z').toISOString() }),
    )
    localStorage.setItem(
      'crosswise_solve_new',
      JSON.stringify({ lastSaved: new Date().toISOString() }),
    )

    manager.cleanupOldSaves(1000)

    const saved = manager.getAllSavedPuzzles()
    expect(saved).toHaveLength(1)
    expect(saved[0].puzzleId).toBe('new')
  })

  it('forces a save using current registrations when no parameters are provided', async () => {
    vi.useFakeTimers()
    const manager = new AutosaveManager()
    const state = createSolveState()
    const onServerSave = vi.fn().mockResolvedValue(undefined)

    manager.startAutosave('puzzle-6', () => state, { onSave: onServerSave })
    manager.forceSave()

    expect(localStorage.getItem('crosswise_solve_puzzle-6')).toBeTruthy()
    await Promise.resolve()
    expect(onServerSave).toHaveBeenCalled()
    manager.stopAutosave()
  })

  it('handles server sync failures without leaving the saving flag stuck', async () => {
    vi.useFakeTimers()
    const manager = new AutosaveManager()
    const state = createSolveState()
    let attempt = 0
    const failingSaveImpl: NonNullable<OnSaveCallback> = async () => {
      attempt += 1
      if (attempt === 1) {
        throw new Error('network down')
      }
    }
    const failingSave = vi.fn(failingSaveImpl)

    manager.startAutosave('puzzle-sync', () => state, { onSave: failingSave })

    await Promise.resolve()
    expect(failingSave).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(
      'Failed to sync solve state to server:',
      expect.any(Error),
    )

    await vi.advanceTimersByTimeAsync(5000)
    expect(failingSave).toHaveBeenCalledTimes(2)

    manager.stopAutosave()
  })

  it('omits corrupted entries when listing saved puzzles', () => {
    const manager = new AutosaveManager()

    localStorage.setItem('crosswise_solve_valid', JSON.stringify({ lastSaved: new Date().toISOString() }))
    localStorage.setItem('crosswise_solve_bad', 'not-json')

    const saved = manager.getAllSavedPuzzles()

    expect(console.error).toHaveBeenCalledWith(
      'Failed to parse saved puzzle data:',
      expect.any(SyntaxError),
    )
    expect(saved.find((entry) => entry.puzzleId === 'bad')).toBeUndefined()
    expect(saved.length).toBeGreaterThanOrEqual(1)
  })

  it('exports and imports solve state round-tripping correctly', () => {
    const manager = new AutosaveManager()
    const state = createSolveState()

    manager.saveToBrowser('puzzle-3', state)
    const exported = manager.exportSolveState('puzzle-3')
    expect(exported).toBeTruthy()

    const isImported = manager.importSolveState('puzzle-4', exported!)
    expect(isImported).toBe(true)

    const imported = manager.loadSolveState('puzzle-4')
    expect(imported?.filledCells['0,0']).toBe('A')
  })

  it('rejects invalid imported solve states', () => {
    const manager = new AutosaveManager()
    const invalid = JSON.stringify({ something: 'else' })

    expect(manager.importSolveState('puzzle-5', invalid)).toBe(false)
  })

  it('exposes bound helpers via useAutosave to call the shared manager', () => {
    const startSpy = vi.spyOn(autosaveManager, 'startAutosave').mockImplementation(() => {})
    const stopSpy = vi.spyOn(autosaveManager, 'stopAutosave').mockImplementation(() => {})
    const bindings = useAutosave()

    bindings.startAutosave('puzzle-7', () => createSolveState())
    expect(startSpy).toHaveBeenCalled()

    bindings.stopAutosave()
    expect(stopSpy).toHaveBeenCalled()
  })
})
