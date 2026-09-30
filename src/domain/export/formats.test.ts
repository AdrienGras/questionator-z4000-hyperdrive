import { describe, expect, test } from 'vitest'
import { makeConfig } from '@/testing/student-fixtures'
import { DECIMAL_2_FORMAT, RATE_FORMAT, dateFormat, scoreFormat } from './formats'

describe('scoreFormat', () => {
  test.each<[{ decimals?: number; step?: number }, string]>([
    [{ step: 1 }, '0'],
    [{ step: 0.5 }, '0.0'],
    [{ step: 0.25 }, '0.00'],
    [{ decimals: 2 }, '0.00'],
    [{ decimals: 3 }, '0.000'],
    [{ decimals: 0 }, '0'],
    [{ step: 2 }, '0'],
  ])('rounding %j → %s', (rounding, expected) => {
    expect(scoreFormat(makeConfig({ rounding }))).toBe(expected)
  })
})

describe('constantes et dates', () => {
  test('taux et décimaux', () => {
    expect(RATE_FORMAT).toBe('0.0%')
    expect(DECIMAL_2_FORMAT).toBe('0.00')
  })

  test('format de date selon la langue', () => {
    expect(dateFormat('fr')).toBe('dd/mm/yyyy hh:mm')
    expect(dateFormat('en')).toBe('yyyy-mm-dd hh:mm')
  })
})
