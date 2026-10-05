import type { NormalizedConfig } from '@/domain/config/normalize'

/** Issue d'un tirage d'entraînement ; `points` et `max` en valeurs du barème (D43). */
export type DrawOutcome =
  | { kind: 'pending' }
  | { kind: 'scored'; points: number; max: number }
  | { kind: 'passed' }

/** Une ligne du journal d'un entraînement ; `id` est attribué par le stockage. */
export type TrainingDraw = {
  id?: number
  trainingId: string
  questionId: string
  drawnAt: string
  outcome: DrawOutcome
}

/** Un entraînement : config normalisée figée à la création. */
export type Training = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  config: NormalizedConfig
}
