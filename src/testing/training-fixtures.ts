import { normalize, type NormalizedConfig } from '@/domain/config/normalize'
import type { Training, TrainingDraw } from '@/domain/training/types'
import { minimalConfig } from './config-fixtures'

/** Config normalisée à 2 catégories : `a` (3 questions, barème 0-2) et `b` (1 question, barème 0-1). */
export function makeTrainingConfig(): NormalizedConfig {
  const config = minimalConfig()
  config.categories = [
    {
      id: 'a',
      label: 'A',
      scale: [0, 1, 2],
      questions: [
        { id: 'a-1', prompt: 'Question A1', tags: ['x'] },
        { id: 'a-2', prompt: 'Question A2', tags: ['x', 'y'] },
        { id: 'a-3', prompt: 'Question A3', tags: [] },
      ],
    },
    {
      id: 'b',
      label: 'B',
      scale: [0, 0.5, 1],
      questions: [{ id: 'b-1', prompt: 'Question B1', tags: ['y'] }],
    },
  ]
  return normalize(config)
}

/** Entraînement de test : `training-1`, config à 2 catégories. */
export function makeTraining(overrides: Partial<Training> = {}): Training {
  return {
    id: 'training-1',
    name: 'Entraînement de test',
    createdAt: '2026-10-05T09:00:00.000Z',
    updatedAt: '2026-10-05T09:00:00.000Z',
    config: makeTrainingConfig(),
    ...overrides,
  }
}

/** Tirage de test : `a-1` en cours de l'entraînement `training-1`. */
export function makeDraw(overrides: Partial<TrainingDraw> = {}): TrainingDraw {
  return {
    trainingId: 'training-1',
    questionId: 'a-1',
    drawnAt: '2026-10-05T09:00:00.000Z',
    outcome: { kind: 'pending' },
    ...overrides,
  }
}
