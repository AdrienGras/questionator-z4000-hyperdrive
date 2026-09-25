import { describe, expect, test } from 'vitest'
import { fraction } from './fraction'

describe('fraction', () => {
  test('conserve numérateur et dénominateur', () => {
    expect(fraction(-3, 4)).toEqual({ num: -3, den: 4 })
  })

  test('refuse un dénominateur nul ou négatif', () => {
    expect(() => fraction(1, 0)).toThrow(RangeError)
    expect(() => fraction(1, -2)).toThrow(RangeError)
  })

  test('refuse des termes non entiers ou hors des entiers sûrs', () => {
    expect(() => fraction(1.5, 2)).toThrow(RangeError)
    expect(() => fraction(2 ** 53, 1)).toThrow(RangeError)
    expect(() => fraction(1, 2 ** 53)).toThrow(RangeError)
  })
})
