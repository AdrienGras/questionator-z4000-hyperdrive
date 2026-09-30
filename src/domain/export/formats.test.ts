import { describe, expect, test } from 'vitest'
import { makeConfig } from '@/testing/student-fixtures'
import { DECIMAL_2_FORMAT, RATE_FORMAT, dateFormat, scoreFormat, valueFormat } from './formats'

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

describe('valueFormat', () => {
  test.each<[number, number, string]>([
    [1, 0.5, '0.0'],
    [0.5, 5.5, '0.0'],
    [1, 0, '0'],
    [1, 12, '0'],
    [0.25, 5.5, '0.00'],
    [0.5, 5.125, '0.000'],
  ])('pas %d, valeur %d → %s', (step, value, expected) => {
    expect(valueFormat(makeConfig({ rounding: { step } }), value)).toBe(expected)
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
