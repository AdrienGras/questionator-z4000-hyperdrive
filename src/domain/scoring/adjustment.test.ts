import { describe, expect, test } from 'vitest'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { isValidAdjustment, parseAdjustmentInput, previewFinal } from './adjustment'
import { toMilli } from './milli'

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

describe('parseAdjustmentInput', () => {
  test.each([
    ['1', 1],
    ['1,5', 1.5],
    ['1.5', 1.5],
    ['+1', 1],
    ['-0,5', -0.5],
    ['\u22120,5', -0.5],
    [' 2 ', 2],
    ['1 000', 1000],
    ['1\u00A0000', 1000],
    ['1\u202F000', 1000],
  ])('%j → %s', (text, expected) => {
    expect(parseAdjustmentInput(text)).toBe(expected)
  })

  test.each(['', '  ', 'abc', '1,2,3', '--1', '1,2345'])('%j → null', (text) => {
    expect(parseAdjustmentInput(text)).toBeNull()
  })
})

describe('previewFinal', () => {
  const config = makeConfig({
    questionsPerStudent: 1,
    maxRawScore: 20,
    finalScale: 20,
    rounding: { mode: 'nearest', decimals: 2, step: 0.5 },
  })

  test('nominal', () => {
    expect(previewFinal(makeStudent([13.5]), config, 1)).toEqual({
      converted: toMilli(13.5),
      adjustment: toMilli(1),
      final: toMilli(14.5),
      clamped: false,
    })
  })

  test('borné en haut', () => {
    const preview = previewFinal(makeStudent([20]), config, 1)
    expect(preview.final).toBe(toMilli(20))
    expect(preview.clamped).toBe(true)
  })

  test('borné en bas', () => {
    const preview = previewFinal(makeStudent([0]), config, -1)
    expect(preview.final).toBe(toMilli(0))
    expect(preview.clamped).toBe(true)
  })

  test('pas de 0,25', () => {
    const quarter = makeConfig({
      questionsPerStudent: 1,
      maxRawScore: 20,
      finalScale: 20,
      rounding: { mode: 'nearest', decimals: 2, step: 0.25 },
    })
    const preview = previewFinal(makeStudent([13.5]), quarter, 0.25)
    expect(preview.final).toBe(preview.converted + 250)
  })

  test("ignore l'ajustement existant", () => {
    const student = makeStudent([13.5], { adjustment: { value: 5 } })
    expect(previewFinal(student, config, 1).final).toBe(toMilli(14.5))
  })

  test('étudiant non done → Error', () => {
    expect(() => previewFinal(makeStudent([]), config, 1)).toThrow(Error)
  })
})
