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
