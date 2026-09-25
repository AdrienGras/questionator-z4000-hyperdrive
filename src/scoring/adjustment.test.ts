import { describe, expect, test } from 'vitest'
import { makeConfig } from '../test/student-fixtures'
import { isValidAdjustment } from './adjustment'

const halfPoints = makeConfig({ finalScale: 20, rounding: { step: 0.5 } })

describe('isValidAdjustment', () => {
  test.each([1, -1.5, 0, 20, -20, 0.5])('%s accepté au pas de 0,5', (value) => {
    expect(isValidAdjustment(value, halfPoints)).toBe(true)
  })

  test.each([
    0.25,
    1.0005,
    20.5,
    -20.5,
    1e20,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])('%s refusé au pas de 0,5, sans lever', (value) => {
    expect(isValidAdjustment(value, halfPoints)).toBe(false)
  })

  test('pas de 0,3', () => {
    const config = makeConfig({ rounding: { step: 0.3 } })
    expect(isValidAdjustment(0.6, config)).toBe(true)
    expect(isValidAdjustment(-0.9, config)).toBe(true)
    expect(isValidAdjustment(0.5, config)).toBe(false)
  })

  test('pas dérivé de decimals', () => {
    const config = makeConfig({ rounding: { decimals: 2 } })
    expect(isValidAdjustment(0.01, config)).toBe(true)
    expect(isValidAdjustment(0.005, config)).toBe(false)
  })
})
