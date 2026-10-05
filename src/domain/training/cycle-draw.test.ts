import { describe, expect, test } from 'vitest'
import { makeDraw, makeTraining } from '@/testing/training-fixtures'
import { cycleCandidates, currentPending, pickTrainingQuestion } from './cycle-draw'
import { TrainingError } from './errors'
import type { DrawOutcome } from './types'

const config = makeTraining().config
const scored: DrawOutcome = { kind: 'scored', points: 1, max: 2 }

function seen(questionId: string, outcome: DrawOutcome = scored) {
  return makeDraw({ questionId, outcome })
}

function ids(draws: ReturnType<typeof seen>[], categoryId = 'a'): string[] {
  return cycleCandidates(config, draws, categoryId).map((q) => q.id)
}

describe('cycleCandidates', () => {
  test('catégorie inconnue : aucune candidate', () => {
    expect(ids([], 'inconnue')).toEqual([])
  })

  test('journal vide : toutes les questions de la catégorie sont candidates', () => {
    expect(ids([])).toEqual(['a-1', 'a-2', 'a-3'])
  })

  test('une question vue sort des candidates jusqu’à la fin du tour', () => {
    expect(ids([seen('a-1')])).toEqual(['a-2', 'a-3'])
  })

  test('passed compte comme vue', () => {
    expect(ids([seen('a-2', { kind: 'passed' })])).toEqual(['a-1', 'a-3'])
  })

  test('pending ne compte pas', () => {
    expect(ids([seen('a-1', { kind: 'pending' })])).toEqual(['a-1', 'a-2', 'a-3'])
  })

  test('catégorie épuisée : remélange', () => {
    const tour = [seen('a-1'), seen('a-2'), seen('a-3')]
    expect(ids(tour)).toEqual(['a-1', 'a-2', 'a-3'])
    expect(ids([...tour, seen('a-1')])).toEqual(['a-2', 'a-3'])
  })

  test('question ajoutée prioritaire', () => {
    expect(ids([seen('a-1'), seen('a-2')])).toEqual(['a-3'])
  })

  test('journal d’une question absente de la config ignoré', () => {
    expect(ids([seen('zz-old')])).toEqual(['a-1', 'a-2', 'a-3'])
  })

  test('les tirages d’une autre catégorie ne comptent pas', () => {
    expect(ids([seen('b-1')])).toEqual(['a-1', 'a-2', 'a-3'])
  })
})

describe('currentPending', () => {
  test('renvoie le tirage en cours, sinon undefined', () => {
    const pending = seen('a-1', { kind: 'pending' })
    expect(currentPending([seen('a-2'), pending])).toBe(pending)
    expect(currentPending([seen('a-2')])).toBeUndefined()
  })
})

describe('pickTrainingQuestion', () => {
  test('tire parmi les candidates', () => {
    expect(pickTrainingQuestion(config, [seen('a-1')], 'a', () => 1)).toBe('a-3')
  })

  test('pending_exists si un tirage est en cours', () => {
    const draws = [seen('a-1', { kind: 'pending' })]
    expect(() => pickTrainingQuestion(config, draws, 'a', () => 0)).toThrow(
      expect.objectContaining({ code: 'pending_exists' }),
    )
  })

  test('category_not_found si la catégorie n’existe pas', () => {
    expect(() => pickTrainingQuestion(config, [], 'nope', () => 0)).toThrow(TrainingError)
    expect(() => pickTrainingQuestion(config, [], 'nope', () => 0)).toThrow(
      expect.objectContaining({ code: 'category_not_found' }),
    )
  })
})
