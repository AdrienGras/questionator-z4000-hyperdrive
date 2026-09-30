import { describe, expect, it } from 'vitest'
import { asMilli } from '@/domain/scoring/milli'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { computeScores } from '@/domain/scoring/score'
import type { StudentStatus } from '@/domain/scoring/status'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { computeGrades, computeHistogram } from './grades'
import type { StudentScore } from './types'

const config20 = makeConfig({ questionsPerStudent: 1, maxRawScore: 2, finalScale: 20 })

/** Étudiant `done` avec une note finale imposée (millièmes), sans passer par l'arrondi de la config. */
function done(final: number, config: NormalizedConfig = config20): StudentScore {
  const student = makeStudent([1])
  const scores = { ...computeScores(student, config), final: asMilli(final) }
  return { student, status: 'done', scores }
}

function other(status: StudentStatus): StudentScore {
  const student = makeStudent(status === 'in_progress' ? ['pending'] : [], {
    absent: status === 'absent',
  })
  return { student, status, scores: computeScores(student, config20) }
}

describe('computeGrades', () => {
  it('ne compte que les étudiants terminés', () => {
    const grades = computeGrades([done(10000), done(20000), other('in_progress'), other('absent')])
    expect(grades.count).toBe(2)
    expect(grades.mean).toBe(15)
    expect(grades.median).toBe(15)
  })
  it('renvoie min et max en millièmes', () => {
    const grades = computeGrades([done(10000), done(20000)])
    expect(grades.min).toBe(asMilli(10000))
    expect(grades.max).toBe(asMilli(20000))
    expect(grades.stdDev).toBe(5)
  })
  it('renvoie tout à null sans terminé', () => {
    expect(computeGrades([other('todo')])).toEqual({
      count: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      stdDev: null,
    })
  })
  it('lève sur un terminé sans note finale (donnée corrompue)', () => {
    const student = makeStudent([1])
    const scores = { ...computeScores(student, config20), final: null }
    expect(() => computeGrades([{ student, status: 'done', scores }])).toThrow(RangeError)
  })
})

/** Accès indexé sûr (`noUncheckedIndexedAccess`) : lève si la barre n'existe pas. */
function at<T>(items: T[], index: number): T {
  const item = items[index]
  if (item === undefined) throw new Error(`Barre ${index} absente`)
  return item
}

const counts = (bins: { count: number }[]) => bins.map((b) => b.count)

describe('computeHistogram', () => {
  it('/20 : 20 barres de largeur 1, 20 et 19,5 dans la dernière', () => {
    const bins = computeHistogram([done(20000), done(19500), done(1000), done(0)], config20)
    expect(bins).toHaveLength(20)
    expect(at(bins, 0)).toEqual({ from: 0, to: 1, count: 1 })
    expect(at(bins, 19).to).toBe(20)
    expect(at(bins, 19).count).toBe(2)
    expect(at(bins, 1).count).toBe(1)
  })

  it('/100 : 20 barres de largeur 5, 99,999 et 100 dans la dernière', () => {
    const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 100, finalScale: 100 })
    const bins = computeHistogram(
      [done(99999, config), done(100000, config), done(5000, config)],
      config,
    )
    expect(bins).toHaveLength(20)
    expect(at(bins, 0)).toMatchObject({ from: 0, to: 5 })
    expect(at(bins, 19)).toEqual({ from: 95, to: 100, count: 2 })
    expect(at(bins, 1).count).toBe(1)
  })

  it('/12,5 : 13 barres, la dernière est [12 ; 12,5] et contient 12,5', () => {
    const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 12.5, finalScale: 12.5 })
    const bins = computeHistogram([done(12500, config)], config)
    expect(bins).toHaveLength(13)
    expect(at(bins, 12)).toEqual({ from: 12, to: 12.5, count: 1 })
  })

  it('/33 : 20 barres de largeur 1,65 sans saut de barre', () => {
    const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 33, finalScale: 33 })
    const bins = computeHistogram(
      [done(1650, config), done(1649, config), done(33000, config)],
      config,
    )
    expect(bins).toHaveLength(20)
    expect(at(bins, 1).from).toBe(1.65)
    expect(at(bins, 19).to).toBe(33)
    expect(at(bins, 1).count).toBe(1)
    expect(at(bins, 0).count).toBe(1)
    expect(at(bins, 19).count).toBe(1)
  })

  it('sans terminé : barres présentes, toutes à 0', () => {
    const bins = computeHistogram([other('todo')], config20)
    expect(bins).toHaveLength(20)
    expect(counts(bins).every((c) => c === 0)).toBe(true)
  })
})
