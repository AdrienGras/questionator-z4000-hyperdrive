import { describe, expect, test } from 'vitest'
import { makeConfig } from '../test/student-fixtures'
import { fraction } from './fraction'
import { asMilli } from './milli'
import { roundToStep, stepMilli, type RoundingMode } from './rounding'

const half = asMilli(500)
const round = (num: number, den: number, step: number, mode: RoundingMode) =>
  roundToStep(fraction(num, den), asMilli(step), mode)

function floorDiv(n: bigint, d: bigint): bigint {
  return n % d !== 0n && n < 0n ? n / d - 1n : n / d
}

describe('roundToStep', () => {
  test.each([
    ['nearest', 13_500],
    ['up', 13_500],
    ['down', 13_000],
  ] as const)('13,25 au pas de 0,5 en %s → %i (égalité vers le haut, D19)', (mode, expected) => {
    expect(roundToStep(fraction(13_250, 1), half, mode)).toBe(expected)
  })

  test("nearest de part et d'autre de l'égalité", () => {
    expect(round(13_249, 1, 500, 'nearest')).toBe(13_000)
    expect(round(13_251, 1, 500, 'nearest')).toBe(13_500)
  })

  test.each(['nearest', 'up', 'down'] as const)('valeur sur la grille inchangée en %s', (mode) => {
    expect(round(13_000, 1, 500, mode)).toBe(13_000)
    expect(round(0, 1, 500, mode)).toBe(0)
  })

  test.each([
    [-250, 'nearest', 0],
    [-250, 'up', 0],
    [-250, 'down', -500],
    [-1, 'nearest', 0],
    [-1, 'up', 0],
    [-1, 'down', -500],
    [-600, 'nearest', -500],
    [-600, 'up', -500],
    [-600, 'down', -1_000],
  ] as const)('valeur négative %i en %s → %i', (value, mode, expected) => {
    expect(round(value, 1, 500, mode)).toBe(expected)
  })

  test('fraction non entière : 20/7 points au centième', () => {
    // 1 point sur 7, ramené sur 20 : 2 000 000 / 7 000 millièmes = 2,857142…
    expect(round(1_000 * 20_000, 7_000, 10, 'nearest')).toBe(2_860)
    expect(round(1_000 * 20_000, 7_000, 10, 'up')).toBe(2_860)
    expect(round(1_000 * 20_000, 7_000, 10, 'down')).toBe(2_850)
  })

  test('refuse un pas nul ou négatif', () => {
    expect(() => round(1, 1, 0, 'nearest')).toThrow(RangeError)
    expect(() => round(1, 1, -500, 'nearest')).toThrow(RangeError)
  })

  test("identique à l'arithmétique exacte (oracle BigInt)", () => {
    // Park–Miller : le produit reste sous 2^47, donc exact en flottant.
    let seed = 42
    const next = (max: number) => {
      seed = (seed * 48_271) % 2_147_483_647
      return seed % max
    }
    for (let i = 0; i < 2_000; i += 1) {
      const num = (next(2) === 0 ? -1 : 1) * next(2_000_000_000) * next(4_000_000)
      const den = 1 + next(10_000_000)
      const step = 1 + next(10_000)
      for (const mode of ['nearest', 'up', 'down'] as const) {
        const d = BigInt(den) * BigInt(step)
        const q = floorDiv(BigInt(num), d)
        const r = BigInt(num) - q * d
        let bump = 0n
        if (mode === 'up' && r > 0n) bump = 1n
        if (mode === 'nearest' && 2n * r >= d) bump = 1n
        const expected = Number((q + bump) * BigInt(step))
        expect(round(num, den, step, mode)).toBe(expected)
      }
    }
  })
})

describe('stepMilli', () => {
  test('rounding.step prioritaire sur decimals', () => {
    expect(stepMilli(makeConfig({ rounding: { step: 0.25, decimals: 3 } }))).toBe(250)
    expect(stepMilli(makeConfig({ rounding: { step: 0.5 } }))).toBe(500)
  })

  test('sinon 10^-decimals', () => {
    expect(stepMilli(makeConfig())).toBe(10)
    expect(stepMilli(makeConfig({ rounding: { decimals: 0 } }))).toBe(1_000)
    expect(stepMilli(makeConfig({ rounding: { decimals: 3 } }))).toBe(1)
  })
})
