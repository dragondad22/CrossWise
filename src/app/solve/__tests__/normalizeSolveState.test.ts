import { describe, expect, it } from 'vitest'

import { normalizeSolveState, resolveSolveState } from '../solveState'
import type { SolveState } from '@/types/crossword'

const createSolveState = (overrides: Partial<SolveState> = {}): SolveState => ({
  filledCells: {},
  startTime: new Date('2024-01-01T00:00:00.000Z'),
  checkResults: {},
  lockedCells: {},
  lastSaved: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

describe('normalizeSolveState', () => {
  it('preserves locked cells from a remote state payload', () => {
    const normalized = normalizeSolveState({
      filledCells: { '0,0': 'A' },
      startTime: '2024-01-01T00:00:00.000Z',
      lockedCells: { '0,0': true, '0,1': true },
    })

    expect(normalized.lockedCells).toEqual({ '0,0': true, '0,1': true })
    expect(normalized.startTime).toBeInstanceOf(Date)
  })

  it('defaults to an empty locked map when remote state omits it', () => {
    const normalized = normalizeSolveState(null)

    expect(normalized.lockedCells).toEqual({})
    expect(normalized.filledCells).toEqual({})
  })
})

describe('resolveSolveState', () => {
  it('returns null when neither state exists', () => {
    expect(resolveSolveState(null, null)).toBeNull()
  })

  it('prefers the local state when remote data is missing', () => {
    const local = createSolveState({ filledCells: { '0,0': 'L' } })
    const resolved = resolveSolveState(local, null)

    expect(resolved).toEqual({ source: 'local', state: local })
  })

  it('prefers the remote state when it is newer', () => {
    const local = createSolveState({ lastSaved: '2024-01-01T00:00:00.000Z' })
    const remote = createSolveState({
      lastSaved: '2024-02-01T00:00:00.000Z',
      filledCells: { '0,0': 'R' },
    })

    const resolved = resolveSolveState(local, remote)

    expect(resolved).toEqual({ source: 'remote', state: remote })
  })

  it('sticks with the local state when timestamps are equal or newer locally', () => {
    const local = createSolveState({ lastSaved: '2024-03-01T00:00:00.000Z' })
    const remote = createSolveState({ lastSaved: '2024-02-01T00:00:00.000Z' })

    const resolved = resolveSolveState(local, remote)

    expect(resolved).toEqual({ source: 'local', state: local })
  })

  it('prefers the higher revision regardless of wall-clock timestamps (#84, ADR-007)', () => {
    // Remote saved by a device with a *slow* clock but a newer revision: the
    // revision must win — clock skew no longer decides reconciliation.
    const local = createSolveState({ revision: 3, lastSaved: '2024-06-01T00:00:00.000Z' })
    const remote = createSolveState({
      revision: 5,
      lastSaved: '2024-01-01T00:00:00.000Z',
      filledCells: { '0,0': 'R' },
    })

    expect(resolveSolveState(local, remote)).toEqual({ source: 'remote', state: remote })
    // And symmetrically: newer local revision wins over a newer remote clock.
    const localNewer = createSolveState({ revision: 7, lastSaved: '2024-01-01T00:00:00.000Z' })
    const remoteOlder = createSolveState({ revision: 6, lastSaved: '2024-06-01T00:00:00.000Z' })
    expect(resolveSolveState(localNewer, remoteOlder)).toEqual({
      source: 'local',
      state: localNewer,
    })
  })

  it('falls back to lastSaved when either side lacks a revision (back-compat)', () => {
    const local = createSolveState({ lastSaved: '2024-01-01T00:00:00.000Z' })
    const remote = createSolveState({ revision: 2, lastSaved: '2024-02-01T00:00:00.000Z' })

    expect(resolveSolveState(local, remote)).toEqual({ source: 'remote', state: remote })
  })

  it('handles missing timestamps by treating them as older data', () => {
    const local = createSolveState({ lastSaved: undefined })
    const remote = createSolveState({ lastSaved: '2024-04-01T12:00:00.000Z' })

    const resolved = resolveSolveState(local, remote)

    expect(resolved).toEqual({ source: 'remote', state: remote })
  })
})
