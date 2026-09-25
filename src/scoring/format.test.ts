import { describe, expect, test } from 'vitest'
import { makeConfig } from '../test/student-fixtures'
import { formatScore } from './format'
import { asMilli, toMilli } from './milli'

const halfPoints = makeConfig({ rounding: { step: 0.5 } })

describe('formatScore', () => {
  test('final : décimales fixes dérivées du pas (D42)', () => {
    expect(formatScore(asMilli(13_500), 'final', halfPoints, 'fr')).toBe('13,5')
    expect(formatScore(asMilli(13_500), 'final', halfPoints, 'en')).toBe('13.5')
    expect(formatScore(asMilli(14_000), 'final', halfPoints, 'fr')).toBe('14,0')
  })

  test('final : -0 s’affiche sans signe moins, un négatif garde le sien', () => {
    expect(formatScore(toMilli(-0), 'final', halfPoints, 'fr')).toBe('0,0')
    expect(formatScore(asMilli(-1_500), 'final', halfPoints, 'fr')).toBe('-1,5')
  })

  test.each<[{ decimals?: number; step?: number }, number, string]>([
    [{ decimals: 2 }, 13_500, '13,50'],
    [{ decimals: 0 }, 14_000, '14'],
    [{ decimals: 3 }, 13_500, '13,500'],
    [{ step: 0.25 }, 13_500, '13,50'],
    [{ step: 0.3 }, 13_500, '13,5'],
    [{ step: 2 }, 14_000, '14'],
  ])('final avec rounding %j : %i -> %s', (rounding, value, expected) => {
    expect(formatScore(asMilli(value), 'final', makeConfig({ rounding }), 'fr')).toBe(expected)
  })

  test('raw : jusqu’à 3 décimales, zéros de fin retirés', () => {
    expect(formatScore(asMilli(7_250), 'raw', halfPoints, 'fr')).toBe('7,25')
    expect(formatScore(asMilli(7_250), 'raw', halfPoints, 'en')).toBe('7.25')
    expect(formatScore(asMilli(7_000), 'raw', halfPoints, 'fr')).toBe('7')
    expect(formatScore(asMilli(1_333), 'raw', halfPoints, 'fr')).toBe('1,333')
  })
})
