import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import { TrainingError } from './errors'
import type { DrawOutcome, TrainingDraw } from './types'

/** Catégorie qui contient la question, ou `undefined` si elle a disparu de la config. */
export function categoryOfQuestion(
  config: NormalizedConfig,
  questionId: string,
): NormalizedCategory | undefined {
  return config.categories.find((c) => c.questions.some((q) => q.id === questionId))
}

/** Note un tirage en cours ; `points` doit être une valeur du barème de la catégorie (D43). */
export function scoredOutcome(
  config: NormalizedConfig,
  draw: TrainingDraw,
  points: number,
): DrawOutcome {
  if (draw.outcome.kind !== 'pending') throw new TrainingError('not_pending')
  const category = categoryOfQuestion(config, draw.questionId)
  if (category === undefined) throw new TrainingError('category_not_found')
  if (!category.scale.includes(points)) throw new TrainingError('score_not_in_scale')
  return { kind: 'scored', points, max: Math.max(...category.scale) }
}

/** Passe un tirage en cours sans le noter. */
export function passedOutcome(draw: TrainingDraw): DrawOutcome {
  if (draw.outcome.kind !== 'pending') throw new TrainingError('not_pending')
  return { kind: 'passed' }
}
