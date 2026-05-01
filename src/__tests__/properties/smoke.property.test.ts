import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

describe('Property-Based Testing Smoke Test', () => {
  it('addition is commutative for any two integers', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        expect(a + b).toBe(b + a)
      })
    )
  })

  it('string concatenation length equals sum of individual lengths', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        expect((a + b).length).toBe(a.length + b.length)
      })
    )
  })
})
