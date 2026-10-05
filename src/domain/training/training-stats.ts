import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import { toMilli } from '@/domain/scoring/milli'
import { categoryOfQuestion } from './resolve-draw'
import type { TrainingDraw } from './types'

/** Une question dont la dernière note est strictement sous la moitié du max est « à revoir ». */
export const REVIEW_THRESHOLD = 0.5

/** `points` et `max` en millièmes ; `rate` entre 0 et 1, `null` sans note. */
export type Rate = { points: number; max: number; rate: number | null }

export type QuestionStats = {
  questionId: string
  categoryId: string
  title: string
  scoredCount: number
  last: { points: number; max: number } | null
  meanRate: number | null
  toReview: boolean
}

export type TrainingStats = {
  scoredCount: number
  passedCount: number
  byCategory: { categoryId: string; label: string; rate: Rate; covered: number; total: number }[]
  byTag: { tag: string; rate: Rate }[]
  questions: QuestionStats[]
  coverage: { covered: number; total: number }
}

type Note = { points: number; max: number; drawnAt: string }

function makeRate(points: number, max: number): Rate {
  return { points, max, rate: max > 0 ? points / max : null }
}

function sumRate(notes: readonly Note[]): Rate {
  const points = notes.reduce((s, n) => s + n.points, 0)
  const max = notes.reduce((s, n) => s + n.max, 0)
  return makeRate(points, max)
}

/** Notes (en millièmes) par question de la config, dans l'ordre du journal ; les questions disparues sont ignorées. */
function notesByQuestion(
  config: NormalizedConfig,
  draws: readonly TrainingDraw[],
): Map<string, Note[]> {
  const known = new Set(config.categories.flatMap((c) => c.questions.map((q) => q.id)))
  const notes = new Map<string, Note[]>()
  for (const draw of draws) {
    if (draw.outcome.kind !== 'scored' || !known.has(draw.questionId)) continue
    const note = {
      points: toMilli(draw.outcome.points),
      max: toMilli(draw.outcome.max),
      drawnAt: draw.drawnAt,
    }
    notes.set(draw.questionId, [...(notes.get(draw.questionId) ?? []), note])
  }
  return notes
}

/** Note la plus récente ; à date égale, la dernière insérée l'emporte. */
function lastNote(notes: readonly Note[]): Note | null {
  let last: Note | null = null
  for (const n of notes) if (last === null || n.drawnAt >= last.drawnAt) last = n
  return last
}

function questionStats(
  category: NormalizedCategory,
  question: NormalizedCategory['questions'][number],
  notes: readonly Note[],
): QuestionStats {
  const last = lastNote(notes)
  const rates = notes.filter((n) => n.max > 0).map((n) => n.points / n.max)
  return {
    questionId: question.id,
    categoryId: category.id,
    title: question.title,
    scoredCount: notes.length,
    last: last && { points: last.points, max: last.max },
    meanRate: rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : null,
    toReview: last !== null && last.points * 2 < last.max,
  }
}

function tagStats(
  config: NormalizedConfig,
  notes: ReadonlyMap<string, Note[]>,
): TrainingStats['byTag'] {
  const byTag = new Map<string, Note[]>()
  for (const category of config.categories) {
    for (const question of category.questions) {
      for (const tag of question.tags) {
        byTag.set(tag, [...(byTag.get(tag) ?? []), ...(notes.get(question.id) ?? [])])
      }
    }
  }
  return [...byTag].map(([tag, list]) => ({ tag, rate: sumRate(list) }))
}

function categoryStats(
  category: NormalizedCategory,
  notes: ReadonlyMap<string, Note[]>,
): TrainingStats['byCategory'][number] {
  const all = category.questions.flatMap((q) => notes.get(q.id) ?? [])
  const covered = category.questions.filter((q) => notes.has(q.id)).length
  return {
    categoryId: category.id,
    label: category.label,
    rate: sumRate(all),
    covered,
    total: category.questions.length,
  }
}

/** Stats d'un entraînement : notes figées (points/max du tirage), questions disparues ignorées. */
export function computeTrainingStats(
  config: NormalizedConfig,
  draws: readonly TrainingDraw[],
): TrainingStats {
  const notes = notesByQuestion(config, draws)
  const byCategory = config.categories.map((c) => categoryStats(c, notes))
  const questions = config.categories.flatMap((c) =>
    c.questions.map((q) => questionStats(c, q, notes.get(q.id) ?? [])),
  )
  return {
    scoredCount: [...notes.values()].reduce((s, l) => s + l.length, 0),
    passedCount: draws.filter(
      (d) => d.outcome.kind === 'passed' && categoryOfQuestion(config, d.questionId),
    ).length,
    byCategory,
    byTag: tagStats(config, notes),
    // Tri stable : « à revoir » d'abord, ordre de la config sinon.
    questions: questions.toSorted((a, b) => Number(b.toReview) - Number(a.toReview)),
    coverage: {
      covered: byCategory.reduce((s, c) => s + c.covered, 0),
      total: byCategory.reduce((s, c) => s + c.total, 0),
    },
  }
}
