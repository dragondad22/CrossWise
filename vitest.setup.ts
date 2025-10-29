import '@testing-library/jest-dom/vitest'

// Ensure timers are cleared between tests to avoid cross-test leakage
afterEach(() => {
  vi.useRealTimers()
})
