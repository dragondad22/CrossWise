import type { SolveState } from '@/types/crossword'

export type RemoteSolveState = Partial<
  Omit<SolveState, 'startTime' | 'endTime' | 'filledCells'> & {
    startTime?: string | Date
    endTime?: string | Date
  }
> & {
  filledCells?: Record<string, string>
  lockedCells?: Record<string, boolean>
}

export const normalizeSolveState = (raw: RemoteSolveState | null | undefined): SolveState => ({
  filledCells: raw?.filledCells ?? {},
  selectedCell: raw?.selectedCell,
  selectedClue: raw?.selectedClue,
  startTime: raw?.startTime ? new Date(raw.startTime) : new Date(),
  endTime: raw?.endTime ? new Date(raw.endTime) : undefined,
  checkResults: raw?.checkResults,
  lastSaved: raw?.lastSaved,
  lockedCells: raw?.lockedCells ?? {},
  revision: typeof raw?.revision === 'number' ? raw.revision : undefined,
})

const getLastSavedTimestamp = (state: SolveState | null | undefined) => {
  if (!state?.lastSaved) return 0
  const value = new Date(state.lastSaved).getTime()
  return Number.isFinite(value) ? value : 0
}

export const resolveSolveState = (
  localState: SolveState | null,
  remoteState: SolveState | null,
): { state: SolveState; source: 'local' | 'remote' } | null => {
  if (localState && remoteState) {
    // Revision beats wall clock (#84, ADR-007): when both sides carry the
    // monotonic counter, the higher revision wins regardless of device clocks.
    const localRevision = localState.revision
    const remoteRevision = remoteState.revision
    if (
      typeof localRevision === 'number' &&
      typeof remoteRevision === 'number' &&
      localRevision !== remoteRevision
    ) {
      return remoteRevision > localRevision
        ? { state: remoteState, source: 'remote' }
        : { state: localState, source: 'local' }
    }

    if (getLastSavedTimestamp(remoteState) > getLastSavedTimestamp(localState)) {
      return { state: remoteState, source: 'remote' }
    }
    return { state: localState, source: 'local' }
  }

  if (localState) {
    return { state: localState, source: 'local' }
  }

  if (remoteState) {
    return { state: remoteState, source: 'remote' }
  }

  return null
}
