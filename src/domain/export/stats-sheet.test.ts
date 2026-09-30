import { describe, expect, test } from 'vitest'
import { asMilli } from '@/domain/scoring/milli'
import type { SessionStats } from '@/domain/stats/types'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig } from '@/testing/student-fixtures'
import { num, text } from './cells'
import { statsSheet } from './stats-sheet'

const bins = Array.from({ length: 20 }, (_, i) => ({ from: i, to: i + 1, count: i === 0 ? 3 : 0 }))

function statsOf(overrides: Partial<SessionStats> = {}): SessionStats {
  return {
    headcount: { total: 5, done: 3, inProgress: 1, todo: 0, absent: 1, addedDuringSession: 2 },
    grades: {
      count: 3,
      min: asMilli(8000),
      max: asMilli(15500),
      mean: 12.3333,
      median: 12,
      stdDev: 2.5,
    },
    histogram: bins,
    categories: [{ categoryId: 'a', choices: 4, scored: 3, successRate: 0.75 }],
    tags: [{ tag: 'algo', scored: 2, successRate: null }],
    topDrawn: [{ categoryId: 'a', questionId: 'a-1', count: 2 }],
    skipped: [
      {
        categoryId: 'a',
        questionId: 'zz',
        total: 3,
        reasons: [
          { reason: 'Hors programme', count: 2 },
          { reason: null, count: 1 },
        ],
      },
    ],
    strategies: [
      {
        composition: [
          { categoryId: 'a', count: 2 },
          { categoryId: 'ghost', count: 1 },
        ],
        students: 2,
        meanFinal: 13.5,
      },
    ],
    adjustments: { count: 1, sum: asMilli(500), mean: 0.5 },
    ...overrides,
  }
}

const session = makeSession({ config: makeConfig({ rounding: { step: 0.5 } }) })
const titleOfA1 = session.config.categories[0]?.questions[0]?.title ?? ''

/** Lignes d'un bloc : de son titre à la ligne vide suivante (exclue). */
function blockOf(rows: unknown[][], title: string): unknown[][] {
  const start = rows.findIndex((row) => JSON.stringify(row) === JSON.stringify([text(title, true)]))
  const end = rows.findIndex((row, i) => i > start && row.length === 0)
  return rows.slice(start, end === -1 ? undefined : end)
}

describe('statsSheet', () => {
  test('neuf titres de bloc en gras, séparés par une ligne vide', () => {
    const { rows, name } = statsSheet(session, statsOf(), 'fr')
    expect(name).toBe('Statistiques')
    const titles = [
      'Effectifs',
      'Notes finales',
      'Histogramme',
      'Catégories',
      'Tags',
      'Questions les plus tirées',
      'Questions passées',
      'Stratégies',
      'Ajustements',
    ]
    const found = rows.filter((row) => row.length === 1).map((row) => row[0])
    expect(found).toEqual(titles.map((title) => text(title, true)))
    expect(rows.filter((row) => row.length === 0)).toHaveLength(8)
  })

  test('effectifs et notes en nombres, au format du pas', () => {
    const { rows } = statsSheet(session, statsOf(), 'fr')
    expect(blockOf(rows, 'Effectifs')[2]).toEqual([num(5), num(3), num(1), num(0), num(1), num(2)])
    expect(blockOf(rows, 'Notes finales')[2]).toEqual([
      num(3),
      num(8, '0.0'),
      num(15.5, '0.0'),
      num(12.3333, '0.00'),
      num(12, '0.00'),
      num(2.5, '0.00'),
    ])
  })

  test('aucun terminé : notes null → cellules vides', () => {
    const grades = { count: 0, min: null, max: null, mean: null, median: null, stdDev: null }
    const { rows } = statsSheet(session, statsOf({ grades }), 'fr')
    expect(blockOf(rows, 'Notes finales')[2]).toEqual([num(0), null, null, null, null, null])
  })

  test('histogramme : intervalles fr, dernier fermé', () => {
    const block = blockOf(statsSheet(session, statsOf(), 'fr').rows, 'Histogramme')
    expect(block[1]).toEqual([text('Intervalle', true), text('Effectif', true)])
    expect(block[2]).toEqual([text('[0 ; 1['), num(3)])
    expect(block.at(-1)).toEqual([text('[19 ; 20]'), num(0)])
    expect(block).toHaveLength(22)
  })

  test('taux au format pourcentage, null → vide, catégorie par libellé', () => {
    const { rows } = statsSheet(session, statsOf(), 'fr')
    expect(blockOf(rows, 'Catégories')[2]).toEqual([text('A'), num(4), num(3), num(0.75, '0.0%')])
    expect(blockOf(rows, 'Tags')[2]).toEqual([text('algo'), num(2), null])
  })

  test('questions par titre, id si inconnue ; motifs sur une cellule', () => {
    const { rows } = statsSheet(session, statsOf(), 'fr')
    expect(blockOf(rows, 'Questions les plus tirées')[2]).toEqual([
      text(titleOfA1),
      text('A'),
      num(2),
    ])
    expect(blockOf(rows, 'Questions passées')[2]).toEqual([
      text('zz'),
      text('A'),
      num(3),
      text('Hors programme ×2, sans motif ×1'),
    ])
  })

  test('composition, catégorie inconnue par son id', () => {
    const { rows } = statsSheet(session, statsOf(), 'fr')
    expect(blockOf(rows, 'Stratégies')[2]).toEqual([
      text('A ×2 · ghost ×1'),
      num(2),
      num(13.5, '0.00'),
    ])
  })

  test('ajustements : somme au format du pas, moyenne null → vide', () => {
    const adjustments = { count: 0, sum: asMilli(0), mean: null }
    const { rows } = statsSheet(session, statsOf({ adjustments }), 'fr')
    expect(blockOf(rows, 'Ajustements')[2]).toEqual([num(0), num(0, '0.0'), null])
    const full = statsSheet(session, statsOf(), 'fr').rows
    expect(blockOf(full, 'Ajustements')[2]).toEqual([num(1), num(0.5, '0.0'), num(0.5, '0.00')])
  })

  test('en anglais : titres, décimales et motif sans libellé', () => {
    const { rows, name } = statsSheet(session, statsOf(), 'en')
    expect(name).toBe('Statistics')
    expect(blockOf(rows, 'Histogram')[2]).toEqual([text('[0 ; 1['), num(3)])
    expect(blockOf(rows, 'Skipped questions')[2]?.[3]).toEqual(
      text('Hors programme ×2, no reason ×1'),
    )
  })
})
