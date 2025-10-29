import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// Ensure timers are cleared between tests to avoid cross-test leakage
afterEach(() => {
  vi.useRealTimers()
})
