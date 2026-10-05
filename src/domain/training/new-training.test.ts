import { describe, expect, test } from 'vitest'
import { makeTrainingConfig } from '@/testing/training-fixtures'
import { newTraining } from './new-training'

describe('newTraining', () => {
  test('nomme l’entraînement d’après le titre de l’examen et pose les dates', () => {
    const config = makeTrainingConfig()
    const training = newTraining(config, {
      newId: () => 'id-42',
      now: () => new Date('2026-10-05T10:00:00.000Z'),
    })
    expect(training).toEqual({
      id: 'id-42',
      name: config.exam.title,
      createdAt: '2026-10-05T10:00:00.000Z',
      updatedAt: '2026-10-05T10:00:00.000Z',
      config,
    })
  })
})
