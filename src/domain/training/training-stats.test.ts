import { describe, expect, it } from 'vitest'
import { makeDraw, makeTraining } from '@/testing/training-fixtures'
import type { TrainingDraw } from './types'
import { computeTrainingStats } from './training-stats'

const config = makeTraining().config

function scored(
  questionId: string,
  points: number,
  max: number,
  drawnAt = '2026-10-05T09:00:00.000Z',
): TrainingDraw {
  return makeDraw({ questionId, drawnAt, outcome: { kind: 'scored', points, max } })
}

const review = (d: TrainingDraw) =>
  computeTrainingStats(config, [d]).questions.find((q) => q.questionId === d.questionId)?.toReview

describe('computeTrainingStats', () => {
  it('journal vide', () => {
    const stats = computeTrainingStats(config, [])
    expect(stats.scoredCount).toBe(0)
    expect(stats.passedCount).toBe(0)
    expect(stats.coverage).toEqual({ covered: 0, total: 4 })
    expect(stats.byCategory.every((c) => c.rate.rate === null && c.covered === 0)).toBe(true)
    expect(stats.byTag.every((t) => t.rate.rate === null)).toBe(true)
    expect(stats.questions).toHaveLength(4)
    expect(stats.questions.every((q) => !q.toReview && q.last === null)).toBe(true)
  })

  it('taux par catégorie en millièmes', () => {
    const stats = computeTrainingStats(config, [scored('a-1', 2, 2), scored('a-2', 1, 2)])
    expect(stats.byCategory[0]?.rate).toEqual({ points: 3000, max: 4000, rate: 0.75 })
    expect(stats.scoredCount).toBe(2)
  })

  it('une question à plusieurs tags compte dans chacun', () => {
    const stats = computeTrainingStats(config, [scored('a-2', 1, 2)])
    expect(stats.byTag.map((t) => t.tag)).toEqual(['x', 'y'])
    expect(stats.byTag[0]?.rate).toEqual({ points: 1000, max: 2000, rate: 0.5 })
    expect(stats.byTag[1]?.rate).toEqual({ points: 1000, max: 2000, rate: 0.5 })
  })

  it('config sans tag : byTag vide', () => {
    const noTags = structuredClone(config)
    for (const c of noTags.categories) for (const q of c.questions) q.tags = []
    expect(computeTrainingStats(noTags, [scored('a-1', 1, 2)]).byTag).toEqual([])
  })

  it('passed compté à part, hors taux', () => {
    const passed = makeDraw({ questionId: 'a-1', outcome: { kind: 'passed' } })
    const stats = computeTrainingStats(config, [passed, makeDraw()])
    expect(stats.passedCount).toBe(1)
    expect(stats.scoredCount).toBe(0)
    expect(stats.byCategory[0]?.rate.rate).toBeNull()
    expect(stats.coverage.covered).toBe(0)
  })

  it('seuil à revoir aux bornes', () => {
    expect(review(scored('a-1', 1, 2))).toBe(false)
    expect(review(scored('a-1', 0, 2))).toBe(true)
    expect(review(scored('b-1', 0.5, 1))).toBe(false)
    expect(review(scored('b-1', 0, 1))).toBe(true)
  })

  it('dernière note = la plus récente par drawnAt', () => {
    const stats = computeTrainingStats(config, [
      scored('a-1', 0, 2, '2026-10-05T10:00:00.000Z'),
      scored('a-1', 2, 2, '2026-10-05T09:00:00.000Z'),
    ])
    const q = stats.questions.find((x) => x.questionId === 'a-1')
    expect(q?.last).toEqual({ points: 0, max: 2000 })
    expect(q?.scoredCount).toBe(2)
    expect(q?.meanRate).toBe(0.5)
  })

  it('égalité de drawnAt : le dernier inséré gagne', () => {
    const stats = computeTrainingStats(config, [scored('a-1', 0, 2), scored('a-1', 2, 2)])
    expect(stats.questions.find((x) => x.questionId === 'a-1')?.last).toEqual({
      points: 2000,
      max: 2000,
    })
  })

  it('à revoir en tête de questions', () => {
    const stats = computeTrainingStats(config, [scored('a-2', 2, 2), scored('b-1', 0, 1)])
    expect(stats.questions.map((q) => q.questionId)).toEqual(['b-1', 'a-1', 'a-2', 'a-3'])
  })

  it('couverture globale et par catégorie', () => {
    const stats = computeTrainingStats(config, [
      scored('a-1', 1, 2),
      scored('a-1', 2, 2),
      scored('b-1', 1, 1),
    ])
    expect(stats.coverage).toEqual({ covered: 2, total: 4 })
    expect(stats.byCategory.map((c) => [c.covered, c.total])).toEqual([
      [1, 3],
      [1, 1],
    ])
  })

  it("journal d'une question supprimée ignoré", () => {
    const stats = computeTrainingStats(config, [scored('zzz', 1, 2)])
    expect(stats.scoredCount).toBe(0)
    expect(stats.coverage.covered).toBe(0)
  })

  it('barème modifié : max figé', () => {
    const stats = computeTrainingStats(config, [scored('a-1', 2, 2)])
    expect(stats.byCategory[0]?.rate.rate).toBe(1)
  })
})
