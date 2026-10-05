import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Training } from './types'

/** Crée un entraînement depuis une config normalisée ; le nom reprend le titre de l'examen. */
export function newTraining(
  config: NormalizedConfig,
  deps: { newId: () => string; now: () => Date },
): Training {
  const at = deps.now().toISOString()
  return { id: deps.newId(), name: config.exam.title, createdAt: at, updatedAt: at, config }
}
