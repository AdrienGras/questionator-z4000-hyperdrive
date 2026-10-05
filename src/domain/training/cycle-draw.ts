import type { NormalizedConfig, NormalizedQuestion } from '@/domain/config/normalize'
import { pickUniform } from '@/domain/passage/random'
import { TrainingError } from './errors'
import type { TrainingDraw } from './types'

/** Tirage en cours du journal (au plus un), s'il existe. */
export function currentPending(draws: readonly TrainingDraw[]): TrainingDraw | undefined {
  return draws.find((draw) => draw.outcome.kind === 'pending')
}

/**
 * Questions tirables d'une catégorie : celles au compte de vues minimal, dans l'ordre de la config.
 * Une vue = un tirage `scored` ou `passed` ; `pending` ne compte pas. Quand toutes ont été vues
 * autant de fois, le tour recommence (remélange) ; une question ajoutée passe en priorité ; les
 * tirages d'une question absente de la config sont ignorés.
 */
export function cycleCandidates(
  config: NormalizedConfig,
  draws: readonly TrainingDraw[],
  categoryId: string,
): NormalizedQuestion[] {
  const category = config.categories.find((c) => c.id === categoryId)
  if (category === undefined) return []
  const views = new Map<string, number>()
  for (const draw of draws) {
    if (draw.outcome.kind === 'pending') continue
    views.set(draw.questionId, (views.get(draw.questionId) ?? 0) + 1)
  }
  const count = (q: NormalizedQuestion) => views.get(q.id) ?? 0
  const min = Math.min(...category.questions.map(count))
  return category.questions.filter((q) => count(q) === min)
}

/** Id de la question tirée dans la catégorie ; refuse si un tirage est en cours ou la catégorie inconnue. */
export function pickTrainingQuestion(
  config: NormalizedConfig,
  draws: readonly TrainingDraw[],
  categoryId: string,
  random: (n: number) => number,
): string {
  if (currentPending(draws) !== undefined) throw new TrainingError('pending_exists')
  if (!config.categories.some((c) => c.id === categoryId)) {
    throw new TrainingError('category_not_found')
  }
  return pickUniform(cycleCandidates(config, draws, categoryId), random).id
}
