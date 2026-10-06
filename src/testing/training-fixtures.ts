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

/** Tirage noté `points / max` (valeurs du barème) de `questionId`, à la minute `minute` après 9 h. */
export function makeScoredDraw(
  questionId: string,
  points: number,
  max: number,
  minute = 0,
): TrainingDraw {
  return makeDraw({
    questionId,
    drawnAt: `2026-10-05T09:${String(minute).padStart(2, '0')}:00.000Z`,
    outcome: { kind: 'scored', points, max },
  })
}

/**
 * Journal type des stats : `a-1` noté 2/2 puis 0,5/2 (à revoir), `a-2` noté 2/2, `a-3` passée.
 * Sur `makeTrainingConfig()` : 3 réponses notées, 1 passée, 2 / 4 questions notées, A à 75 %.
 */
export function makeStatsDraws(): TrainingDraw[] {
  return [
    makeScoredDraw('a-1', 2, 2, 0),
    makeScoredDraw('a-1', 0.5, 2, 1),
    makeScoredDraw('a-2', 2, 2, 2),
    makeDraw({
      questionId: 'a-3',
      drawnAt: '2026-10-05T09:03:00.000Z',
      outcome: { kind: 'passed' },
    }),
  ]
}
