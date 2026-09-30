import { describe, expect, it } from 'vitest'
import exampleText from '../../../examples/config.example.json?raw'
import { validateConfig } from '@/domain/config/validate'
import { makeSession } from '@/testing/session-fixtures'
import { attemptOf, sessionWith } from '@/testing/stats-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { computeStats } from './compute-stats'

describe('computeStats', () => {
  it('reste vide sans étudiant terminé', () => {
    const stats = computeStats(sessionWith([[attemptOf('a', 'a-1', 'pending')]]))
    expect(stats.grades).toEqual({
      count: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      stdDev: null,
    })
    expect(stats.strategies).toEqual([])
    expect(stats.histogram.every((bin) => bin.count === 0)).toBe(true)
    expect(stats.headcount.inProgress).toBe(1)
  })

  it('agrège la config d’exemple', () => {
    const result = validateConfig(exampleText, { cssSupports: () => true })
    if (!result.ok) throw new Error('exemple invalide')
    const { config } = result
    const [first, second] = config.categories
    if (!first || !second) throw new Error('exemple sans catégories')
    const q = (category: typeof first) => category.questions[0]?.id ?? ''
    const maxOf = (category: typeof first) => Math.max(...category.scale)
    const draws = (index: number) =>
      Array.from({ length: config.scoring.questionsPerStudent }, () =>
        attemptOf(first.id, q(first), maxOf(first) / (index + 1)),
      )
    const session = makeSession({
      config,
      students: [
        makeStudent([], { id: 's1', order: 1, attempts: draws(0) }),
        makeStudent([], { id: 's2', order: 2, attempts: draws(1) }),
        makeStudent([], { id: 's3', order: 3, absent: true }),
      ],
    })
    const stats = computeStats(session)
    expect(stats.headcount.done).toBe(2)
    expect(stats.headcount.absent).toBe(1)
    expect(stats.categories).toHaveLength(4)
    expect(stats.histogram).toHaveLength(20)
    expect(stats.grades.count).toBe(2)
  })
})
