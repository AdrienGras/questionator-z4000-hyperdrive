import { describe, expect, it } from 'vitest'
import { minimalConfig } from '@/testing/config-fixtures'
import { attemptOf, sessionWith } from '@/testing/stats-fixtures'
import { computeCategories } from './categories'

describe('computeCategories', () => {
  it('compte les choix, les notés et le taux de réussite', () => {
    const session = sessionWith([
      [
        attemptOf('a', 'a-1', 2),
        attemptOf('a', 'a-1', 1),
        attemptOf('a', 'a-1', { skipped: 'Hors programme' }),
        attemptOf('a', 'a-1', 'pending'),
      ],
    ])
    expect(computeCategories(session)).toEqual([
      { categoryId: 'a', choices: 3, scored: 2, successRate: 0.75 },
    ])
  })

  it('garde les catégories sans attempt, dans l’ordre de la config', () => {
    const config = minimalConfig()
    config.categories = [
      { id: 'b', label: 'B', order: 2, scale: [0, 1], questions: [{ id: 'b-1', prompt: 'B1' }] },
      { id: 'a', label: 'A', order: 1, scale: [0, 1, 2], questions: [{ id: 'a-1', prompt: 'A1' }] },
    ]
    const session = sessionWith([[attemptOf('b', 'b-1', 1)]], config)
    expect(computeCategories(session)).toEqual([
      { categoryId: 'a', choices: 0, scored: 0, successRate: null },
      { categoryId: 'b', choices: 1, scored: 1, successRate: 1 },
    ])
  })

  it('renvoie null quand le barème maximal vaut 0', () => {
    const config = minimalConfig()
    config.categories = [
      { id: 'a', label: 'A', scale: [0], questions: [{ id: 'a-1', prompt: 'A1' }] },
    ]
    const session = sessionWith([[attemptOf('a', 'a-1', 0)]], config)
    expect(computeCategories(session)).toEqual([
      { categoryId: 'a', choices: 1, scored: 1, successRate: null },
    ])
  })

  it('donne un taux négatif sur un barème à valeurs négatives (points ÷ maximum)', () => {
    const config = minimalConfig()
    config.categories = [
      { id: 'a', label: 'A', scale: [-2, -1, 1], questions: [{ id: 'a-1', prompt: 'A1' }] },
    ]
    const session = sessionWith([[attemptOf('a', 'a-1', -2), attemptOf('a', 'a-1', 1)]], config)
    expect(computeCategories(session)).toEqual([
      { categoryId: 'a', choices: 2, scored: 2, successRate: -0.5 },
    ])
  })

  it('ignore un absent aux attempts résiduels', () => {
    const session = sessionWith([[attemptOf('a', 'a-1', 2)]], minimalConfig(), () => ({
      absent: true,
    }))
    expect(computeCategories(session)).toEqual([
      { categoryId: 'a', choices: 0, scored: 0, successRate: null },
    ])
  })

  it('lève sur un attempt noté sans score', () => {
    const broken = { ...attemptOf('a', 'a-1', 1), score: undefined }
    expect(() => computeCategories(sessionWith([[broken]]))).toThrow(/sans score/)
  })
})
