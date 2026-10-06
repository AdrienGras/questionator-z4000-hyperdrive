import type { NormalizedConfig } from '@/domain/config/normalize'
import { categoryOfQuestion } from './resolve-draw'
import type { Training, TrainingDraw } from './types'

/**
 * Remplace la config d'un entraînement ; le nom suit le titre de l'examen. Renvoie aussi les ids
 * des tirages `pending` dont la question n'existe plus. `updatedAt` est posé par `lib/db`.
 */
export function replaceTrainingConfig(
  training: Training,
  config: NormalizedConfig,
  draws: readonly TrainingDraw[],
): { training: Training; orphanPendingIds: number[] } {
  const orphanPendingIds: number[] = []
  for (const d of draws) {
    if (d.outcome.kind !== 'pending' || d.id === undefined) continue
    if (categoryOfQuestion(config, d.questionId) === undefined) orphanPendingIds.push(d.id)
  }
  return { training: { ...training, name: config.exam.title, config }, orphanPendingIds }
}

/** Ensemble des ids de questions d'une config, toutes catégories confondues. */
function questionIds(config: NormalizedConfig): Set<string> {
  return new Set(config.categories.flatMap((c) => c.questions.map((q) => q.id)))
}

/**
 * Bilan d'une mise à jour de config, compté par `id` de question toutes catégories confondues :
 * une question qui change de catégorie est conservée.
 */
export function diffTrainingConfig(
  current: NormalizedConfig,
  next: NormalizedConfig,
): { kept: number; added: number; removed: number } {
  const before = questionIds(current)
  const after = questionIds(next)
  let kept = 0
  for (const id of after) if (before.has(id)) kept++
  return { kept, added: after.size - kept, removed: before.size - kept }
}
