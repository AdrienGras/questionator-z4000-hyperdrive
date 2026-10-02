import { describe, expect, it } from 'vitest'
import { minimalConfig } from '@/testing/config-fixtures'
import { attemptOf, sessionWith } from '@/testing/stats-fixtures'
import { computeSkipped, computeTopDrawn } from './questions'

function manyQuestions() {
  const config = minimalConfig()
  config.skips = { enabled: true, reasons: ['Hors programme', 'Trop long'] }
  config.categories = [
    {
      id: 'a',
      label: 'A',
      scale: [0, 1, 2],
      questions: Array.from({ length: 12 }, (_, i) => ({ id: `a-${i + 1}`, prompt: `Q${i + 1}` })),
    },
  ]
  return config
}

describe('computeTopDrawn', () => {
  it('trie par nombre décroissant, ex æquo dans l’ordre de la config, limité à 10', () => {
    const attempts = [
      ...Array.from({ length: 11 }, (_, i) => attemptOf('a', `a-${i + 1}`, 1)),
      attemptOf('a', 'a-9', 'pending'),
      attemptOf('a', 'a-9', 1),
      attemptOf('a', 'a-4', 1),
      attemptOf('a', 'a-3', 1),
    ]
    const top = computeTopDrawn(sessionWith([attempts], manyQuestions()))
    expect(top).toHaveLength(10)
    expect(top[0]).toEqual({ categoryId: 'a', questionId: 'a-9', count: 3 })
    expect(top.slice(1, 3).map((q) => q.questionId)).toEqual(['a-3', 'a-4'])
    expect(top.slice(1, 3).map((q) => q.count)).toEqual([2, 2])
  })

  it('garde une question inconnue après les connues à nombre égal', () => {
    const session = sessionWith(
      [[attemptOf('a', 'fantome', 1), attemptOf('a', 'a-2', 1)]],
      manyQuestions(),
    )
    expect(computeTopDrawn(session).map((q) => q.questionId)).toEqual(['a-2', 'fantome'])
  })

  it('ignore un absent aux attempts résiduels', () => {
    const session = sessionWith([[attemptOf('a', 'a-1', 1)]], manyQuestions(), () => ({
      absent: true,
    }))
    expect(computeTopDrawn(session)).toEqual([])
  })
})

describe('computeSkipped', () => {
  it('regroupe les motifs sans les normaliser, « sans motif » en dernier', () => {
    const session = sessionWith(
      [
        [
          attemptOf('a', 'a-1', {}),
          attemptOf('a', 'a-1', { skipped: 'hors programme' }),
          attemptOf('a', 'a-1', { skipped: 'Hors programme' }),
          attemptOf('a', 'a-2', 1),
        ],
      ],
      manyQuestions(),
    )
    expect(computeSkipped(session)).toEqual([
      {
        categoryId: 'a',
        questionId: 'a-1',
        total: 3,
        reasons: [
          { reason: 'Hors programme', count: 1 },
          { reason: 'hors programme', count: 1 },
          { reason: null, count: 1 },
        ],
      },
    ])
  })

  it('trie les motifs par nombre puis par ordre configuré, et met null en dernier même en tête', () => {
    const session = sessionWith(
      [
        [
          attemptOf('a', 'a-1', {}),
          attemptOf('a', 'a-1', {}),
          attemptOf('a', 'a-1', { skipped: 'Trop long' }),
          attemptOf('a', 'a-1', { skipped: 'Hors programme' }),
          attemptOf('a', 'a-1', { skipped: 'Autre' }),
        ],
      ],
      manyQuestions(),
    )
    const [entry] = computeSkipped(session)
    expect(entry?.reasons.map((r) => r.reason)).toEqual([
      'Hors programme',
      'Trop long',
      'Autre',
      null,
    ])
  })

  it('départage par ordre alphabétique seul les motifs hors config à nombre égal', () => {
    const session = sessionWith(
      [
        [
          attemptOf('a', 'a-1', { skipped: 'Zèbre' }),
          attemptOf('a', 'a-1', { skipped: 'Malade' }),
          attemptOf('a', 'a-1', { skipped: 'Absent du cours' }),
        ],
      ],
      manyQuestions(),
    )
    const [entry] = computeSkipped(session)
    expect(entry?.reasons.map((r) => r.reason)).toEqual(['Absent du cours', 'Malade', 'Zèbre'])
  })

  it('garde une question inconnue après les connues à total égal', () => {
    const session = sessionWith(
      [[attemptOf('a', 'fantome', { skipped: 'x' }), attemptOf('a', 'a-2', { skipped: 'x' })]],
      manyQuestions(),
    )
    expect(computeSkipped(session)).toEqual([
      { categoryId: 'a', questionId: 'a-2', total: 1, reasons: [{ reason: 'x', count: 1 }] },
      { categoryId: 'a', questionId: 'fantome', total: 1, reasons: [{ reason: 'x', count: 1 }] },
    ])
  })

  it('trie les questions par total décroissant puis ordre de la config', () => {
    const session = sessionWith(
      [
        [
          attemptOf('a', 'a-2', { skipped: 'x' }),
          attemptOf('a', 'a-1', { skipped: 'x' }),
          attemptOf('a', 'a-3', { skipped: 'x' }),
          attemptOf('a', 'a-3', { skipped: 'x' }),
        ],
      ],
      manyQuestions(),
    )
    expect(computeSkipped(session).map((q) => q.questionId)).toEqual(['a-3', 'a-1', 'a-2'])
  })

  it('ignore un absent aux attempts résiduels', () => {
    const session = sessionWith(
      [[attemptOf('a', 'a-1', { skipped: 'x' })]],
      manyQuestions(),
      () => ({
        absent: true,
      }),
    )
    expect(computeSkipped(session)).toEqual([])
  })
})
