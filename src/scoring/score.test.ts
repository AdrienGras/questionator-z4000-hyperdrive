import { describe, expect, test } from 'vitest'
import type { ParsedConfig } from '../config/schema'
import { makeConfig, makeStudent } from '../test/student-fixtures'
import { computeScores } from './score'

const halfPoints = { rounding: { step: 0.5 } }

describe('computeScores', () => {
  test('plafond atteint', () => {
    const config = makeConfig({ questionsPerStudent: 3, maxRawScore: 10, ...halfPoints })
    expect(computeScores(makeStudent([4, 4, 4]), config)).toEqual({
      raw: 12_000,
      capped: 10_000,
      converted: 20_000,
      adjustment: 0,
      final: 20_000,
    })
  })

  test('brute sous le plafond', () => {
    const config = makeConfig({ questionsPerStudent: 3, maxRawScore: 10, ...halfPoints })
    expect(computeScores(makeStudent([2, 3, 1]), config)).toMatchObject({
      raw: 6_000,
      capped: 6_000,
      converted: 12_000,
      final: 12_000,
    })
  })

  test('barèmes décimaux sans dérive', () => {
    const tenths = makeConfig({ questionsPerStudent: 10, maxRawScore: 10 })
    expect(computeScores(makeStudent(Array.from({ length: 10 }, () => 0.1)), tenths).raw).toBe(
      1_000,
    )
    const pair = makeConfig({ questionsPerStudent: 2, maxRawScore: 10 })
    expect(computeScores(makeStudent([0.1, 0.2]), pair).raw).toBe(300)
    const halves = makeConfig({ questionsPerStudent: 20, maxRawScore: 10 })
    expect(computeScores(makeStudent(Array.from({ length: 20 }, () => 0.5)), halves).raw).toBe(
      10_000,
    )
  })

  test.each([
    [7, 1, 'nearest', 2_860],
    [7, 3, 'nearest', 8_570],
    [3, 1, 'nearest', 6_670],
    [3, 1, 'down', 6_660],
    [3, 1, 'up', 6_670],
    [3, 2, 'nearest', 13_330],
  ] as const)(
    'conversion non entière : plafond %i, brute %i, %s → %i',
    (max, score, mode, expected) => {
      const config = makeConfig({ questionsPerStudent: 1, maxRawScore: max, rounding: { mode } })
      expect(computeScores(makeStudent([score]), config).converted).toBe(expected)
    },
  )

  test('pas de 0,3 sur /20 : le plafond donne 20, pas 20,1 (D20)', () => {
    const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 10, rounding: { step: 0.3 } })
    expect(computeScores(makeStudent([10]), config)).toMatchObject({
      converted: 20_000,
      final: 20_000,
    })
    expect(computeScores(makeStudent([0]), config)).toMatchObject({ converted: 0, final: 0 })
  })

  test.each([
    [20, 1, 20_000, 20_000],
    [0, -2, 0, 0],
    [13.5, 1, 13_500, 14_500],
    [13.5, -0.5, 13_500, 13_000],
  ])(
    'brute %s + ajustement %s : convertie %i, finale %i',
    (score, adjustment, converted, final) => {
      const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 20, ...halfPoints })
      const student = makeStudent([score], { adjustment: { value: adjustment } })
      expect(computeScores(student, config)).toMatchObject({
        converted,
        adjustment: adjustment * 1000,
        final,
      })
    },
  )

  test('la convertie est arrondie avant l’ajustement : 13,5 + 1 = 14,5 (D02)', () => {
    // 20 / 30 × 20 = 13,333… → 13,5 au pas de 0,5.
    const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 30, ...halfPoints })
    const student = makeStudent([20], { adjustment: { value: 1 } })
    expect(computeScores(student, config)).toMatchObject({ converted: 13_500, final: 14_500 })
  })

  test('pas de note convertie ni finale en cours ou à passer (D21)', () => {
    const config = makeConfig({ questionsPerStudent: 2, maxRawScore: 10 })
    const partial = makeStudent([5], { adjustment: { value: 1 } })
    expect(computeScores(partial, config)).toEqual({
      raw: 5_000,
      capped: 5_000,
      converted: null,
      adjustment: 1_000,
      final: null,
    })
    expect(computeScores(makeStudent(), config)).toMatchObject({
      raw: 0,
      converted: null,
      final: null,
    })
  })

  test('absent : ni convertie, ni finale, ajustement ignoré', () => {
    const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 10 })
    const student = makeStudent([4], { absent: true, adjustment: { value: 2 } })
    expect(computeScores(student, config)).toEqual({
      raw: 4_000,
      capped: 4_000,
      converted: null,
      adjustment: 0,
      final: null,
    })
  })

  test('un attempt noté sans score est une donnée corrompue', () => {
    const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 10 })
    const student = makeStudent([1])
    delete student.attempts[0]!.score
    expect(() => computeScores(student, config)).toThrow(/sans score/)
  })

  const sweeps: Partial<ParsedConfig['scoring']>[] = [
    { maxRawScore: 7, finalScale: 20, rounding: { step: 0.5, mode: 'nearest' } },
    { maxRawScore: 10, finalScale: 20, rounding: { step: 0.3, mode: 'up' } },
    { maxRawScore: 3, finalScale: 20, rounding: { decimals: 2, mode: 'down' } },
    { maxRawScore: 12.5, finalScale: 10, rounding: { decimals: 1, mode: 'nearest' } },
  ]

  test.each(sweeps)('balayage des brutes : bornée, sur la grille, monotone (%j)', (scoring) => {
    const config = makeConfig({ questionsPerStudent: 1, ...scoring })
    const scale = config.scoring.finalScale * 1000
    const step = (config.scoring.rounding.step ?? 10 ** -config.scoring.rounding.decimals) * 1000
    const max = config.scoring.maxRawScore
    let previous = -1
    for (let quarters = 0; quarters <= (max + 1) * 4; quarters += 1) {
      const { converted } = computeScores(makeStudent([quarters / 4]), config)
      expect(converted).not.toBeNull()
      const value = converted!
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(scale)
      expect(value === scale || value % Math.round(step) === 0).toBe(true)
      expect(value).toBeGreaterThanOrEqual(previous)
      expect(quarters / 4 < max || value === scale).toBe(true)
      previous = value
    }
    expect(computeScores(makeStudent([0]), config).converted).toBe(0)
  })
})
