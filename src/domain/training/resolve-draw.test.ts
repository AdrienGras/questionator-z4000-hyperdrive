import { describe, expect, test } from 'vitest'
import { makeDraw, makeTraining } from '@/testing/training-fixtures'
import { TrainingError } from './errors'
import { categoryOfQuestion, passedOutcome, scoredOutcome } from './resolve-draw'

const config = makeTraining().config

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (error) {
    return error instanceof TrainingError ? error.code : undefined
  }
  return undefined
}

describe('scoredOutcome', () => {
  test('accepte une note du barème et renvoie le max de la catégorie', () => {
    const draw = makeDraw({ questionId: 'a-2' })
    expect(scoredOutcome(config, draw, 1)).toEqual({ kind: 'scored', points: 1, max: 2 })
  })

  test('refuse une note hors barème', () => {
    const draw = makeDraw({ questionId: 'a-2' })
    expect(codeOf(() => scoredOutcome(config, draw, 0.5))).toBe('score_not_in_scale')
  })

  test('accepte une note décimale du barème de la catégorie b', () => {
    const draw = makeDraw({ questionId: 'b-1' })
    expect(scoredOutcome(config, draw, 0.5)).toEqual({ kind: 'scored', points: 0.5, max: 1 })
  })

  test('refuse un tirage déjà noté', () => {
    const draw = makeDraw({ outcome: { kind: 'scored', points: 1, max: 2 } })
    expect(codeOf(() => scoredOutcome(config, draw, 1))).toBe('not_pending')
  })

  test('refuse une question absente de la config', () => {
    const draw = makeDraw({ questionId: 'inconnue' })
    expect(codeOf(() => scoredOutcome(config, draw, 1))).toBe('category_not_found')
  })
})

describe('passedOutcome', () => {
  test('passe un tirage en cours', () => {
    expect(passedOutcome(makeDraw())).toEqual({ kind: 'passed' })
  })

  test('refuse de passer un tirage déjà passé', () => {
    expect(codeOf(() => passedOutcome(makeDraw({ outcome: { kind: 'passed' } })))).toBe(
      'not_pending',
    )
  })
})

describe('categoryOfQuestion', () => {
  test('trouve la catégorie de la question', () => {
    expect(categoryOfQuestion(config, 'b-1')?.id).toBe('b')
  })

  test('renvoie undefined pour une question inconnue', () => {
    expect(categoryOfQuestion(config, 'zzz')).toBeUndefined()
  })
})
