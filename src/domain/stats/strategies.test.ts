import { describe, expect, it } from 'vitest'
import { computeScores } from '@/domain/scoring/score'
import { studentStatus } from '@/domain/scoring/status'
import { minimalConfig } from '@/testing/config-fixtures'
import { attemptOf, sessionWith } from '@/testing/stats-fixtures'
import { computeStrategies } from './strategies'
import type { StudentScore } from './types'

function threeCategories() {
  const config = minimalConfig()
  config.scoring = { questionsPerStudent: 3, maxRawScore: 6, finalScale: 20 }
  config.categories = ['f', 'n', 'd'].map((id, index) => ({
    id,
    label: id.toUpperCase(),
    order: index + 1,
    scale: [0, 1, 2],
    questions: [{ id: `${id}-1`, prompt: `${id}1` }],
  }))
  return config
}

function strategiesOf(
  attempts: ReturnType<typeof attemptOf>[][],
  overrides?: Parameters<typeof sessionWith>[2],
) {
  const session = sessionWith(attempts, threeCategories(), overrides)
  const scored: StudentScore[] = session.students.map((student) => ({
    student,
    status: studentStatus(student, session.config),
    scores: computeScores(student, session.config),
  }))
  return computeStrategies(scored, session.config)
}

const draw = (categories: string[], score = 1) =>
  categories.map((id) => attemptOf(id, `${id}-1`, score))

describe('computeStrategies', () => {
  it('regroupe les ordres de choix et omet les catégories absentes', () => {
    const result = strategiesOf([draw(['d', 'f', 'f']), draw(['f', 'd', 'f'], 2)])
    expect(result).toEqual([
      {
        composition: [
          { categoryId: 'f', count: 2 },
          { categoryId: 'd', count: 1 },
        ],
        students: 2,
        meanFinal: 15, // (3/6 → 10) et (6/6 → 20)
      },
    ])
  })

  it('distingue les multiensembles différents et trie par effectif décroissant', () => {
    const result = strategiesOf([
      draw(['f', 'd', 'd']),
      draw(['d', 'f', 'f']),
      draw(['f', 'f', 'd']),
    ])
    expect(result.map((s) => [s.composition, s.students])).toEqual([
      [
        [
          { categoryId: 'f', count: 2 },
          { categoryId: 'd', count: 1 },
        ],
        2,
      ],
      [
        [
          { categoryId: 'f', count: 1 },
          { categoryId: 'd', count: 2 },
        ],
        1,
      ],
    ])
  })

  it('départage les ex æquo par ordre des catégories puis nombre décroissant', () => {
    const result = strategiesOf([
      draw(['d', 'd', 'd']),
      draw(['f', 'n', 'd']),
      draw(['f', 'f', 'n']),
    ])
    expect(
      result.map((s) => s.composition.map((c) => `${c.categoryId}${c.count}`).join('')),
    ).toEqual(['f2n1', 'f1n1d1', 'd3'])
  })

  it('ignore les skips, les étudiants en cours et les absents', () => {
    const result = strategiesOf(
      [
        [...draw(['f', 'f']), attemptOf('n', 'n-1', { skipped: 'x' }), attemptOf('d', 'd-1', 1)],
        draw(['f', 'f']),
        draw(['n', 'n', 'n']),
      ],
      (index) => (index === 2 ? { absent: true } : {}),
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.composition).toEqual([
      { categoryId: 'f', count: 2 },
      { categoryId: 'd', count: 1 },
    ])
    expect(result[0]?.students).toBe(1)
  })

  it('renvoie une liste vide sans étudiant terminé', () => {
    expect(strategiesOf([draw(['f'])])).toEqual([])
  })
})
