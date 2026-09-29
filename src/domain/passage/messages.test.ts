import { describe, expect, test } from 'vitest'
import { PassageError, type PassageErrorCode } from './errors'
import { passageErrorMessage } from './messages'

const codes: PassageErrorCode[] = [
  'student_not_found',
  'category_not_found',
  'attempt_not_found',
  'student_absent',
  'student_done',
  'pending_exists',
  'category_exhausted',
  'not_pending',
  'score_not_in_scale',
  'skips_disabled',
  'skip_quota_reached',
  'reason_not_allowed',
  'student_not_done',
  'adjustment_invalid',
  'no_next_student',
  'not_scored',
  'student_name_required',
]

describe('passageErrorMessage', () => {
  test.each(codes)('%s : message non vide en fr et en', (code) => {
    const error = new PassageError(code)
    expect(passageErrorMessage(error, 'fr')).not.toBe('')
    expect(passageErrorMessage(error, 'en')).not.toBe('')
  })

  test('pending_exists en fr est exact', () => {
    const error = new PassageError('pending_exists')
    expect(passageErrorMessage(error, 'fr')).toBe(
      'Une question est déjà en cours : notez-la d’abord.',
    )
  })

  test('student_name_required : messages exacts', () => {
    const error = new PassageError('student_name_required')
    expect(passageErrorMessage(error, 'fr')).toBe('Le nom et le prénom sont obligatoires.')
    expect(passageErrorMessage(error, 'en')).toBe('Last name and first name are required.')
  })
})
