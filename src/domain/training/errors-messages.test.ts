import { describe, expect, test } from 'vitest'
import { TrainingError, type TrainingErrorCode } from './errors'
import { trainingErrorMessage } from './errors-messages'

const codes: TrainingErrorCode[] = [
  'category_not_found',
  'pending_exists',
  'not_pending',
  'score_not_in_scale',
]

describe('trainingErrorMessage', () => {
  test.each(codes)('%s : message non vide en fr et en', (code) => {
    const error = new TrainingError(code)
    expect(trainingErrorMessage(error, 'fr')).not.toBe('')
    expect(trainingErrorMessage(error, 'en')).not.toBe('')
  })
})
