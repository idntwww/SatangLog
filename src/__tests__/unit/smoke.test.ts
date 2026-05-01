import { describe, it, expect } from 'vitest'

describe('Smoke Test', () => {
  it('should verify test setup works', () => {
    expect(1 + 1).toBe(2)
  })

  it('should resolve path aliases', async () => {
    const { cn } = await import('@/lib/utils')
    expect(cn).toBeDefined()
    expect(typeof cn).toBe('function')
  })
})
