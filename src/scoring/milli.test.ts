import { describe, expect, test } from 'vitest'
import {
  asMilli,
  assertSafeInteger,
  fromMilli,
  hasAtMostThreeDecimals,
  roundToMilli,
  toMilli,
} from './milli'

describe('toMilli / fromMilli', () => {
  test('0,1 + 0,2 vaut exactement 0,3 en millièmes', () => {
    expect(toMilli(0.1) + toMilli(0.2)).toBe(toMilli(0.3))
    expect(toMilli(0.3)).toBe(300)
  })

  test('dix dixièmes font exactement 1', () => {
    const sum = Array.from({ length: 10 }, () => toMilli(0.1)).reduce((a, b) => a + b, 0)
    expect(sum).toBe(1000)
  })

  test('aller-retour exact sur 3 décimales', () => {
    expect(toMilli(13.5)).toBe(13500)
    expect(fromMilli(toMilli(0.3))).toBe(0.3)
    expect(fromMilli(toMilli(-1.125))).toBe(-1.125)
  })

  test('lève hors des entiers sûrs ou sur NaN', () => {
    expect(() => toMilli(1e16)).toThrow(RangeError)
    expect(() => toMilli(Number.NaN)).toThrow(RangeError)
    expect(() => toMilli(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })

  test('roundToMilli ne lève jamais', () => {
    expect(roundToMilli(1e20)).toBe(1e23)
    expect(roundToMilli(1.2344)).toBe(1234)
  })
})

describe('gardes', () => {
  test('assertSafeInteger renvoie la valeur ou lève', () => {
    expect(assertSafeInteger(42)).toBe(42)
    expect(() => assertSafeInteger(1.5)).toThrow(RangeError)
    expect(() => assertSafeInteger(2 ** 53)).toThrow(RangeError)
  })

  test('asMilli refuse un non-entier', () => {
    expect(asMilli(-500)).toBe(-500)
    expect(() => asMilli(0.5)).toThrow(RangeError)
  })
})

describe('hasAtMostThreeDecimals', () => {
  test('accepte 3 décimales et les entiers, même grands', () => {
    expect(hasAtMostThreeDecimals(0.125)).toBe(true)
    expect(hasAtMostThreeDecimals(1e20)).toBe(true)
  })

  test('refuse une 4e décimale', () => {
    expect(hasAtMostThreeDecimals(0.1255)).toBe(false)
  })
})
