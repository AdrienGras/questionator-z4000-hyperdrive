import { describe, expect, test } from 'vitest'
import { normalize, type NormalizedConfig } from '@/domain/config/normalize'
import type { ParsedConfig } from '@/domain/config/schema'
import { studentStatus } from '@/domain/scoring/status'
import type { Session } from '@/domain/session/types'
import { minimalConfig } from '@/testing/config-fixtures'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { availableQuestions, questionIndex } from './selectors'
import { MAX_SKIP_REASON_LENGTH, skipAttempt, skipsRemaining } from './skip'

function makeSkipConfig(skips: ParsedConfig['skips'] = {}): NormalizedConfig {
  const config = minimalConfig()
  config.scoring = { ...config.scoring, questionsPerStudent: 2 }
  config.skips = { enabled: true, maxPerStudent: 1, ...skips }
  config.categories = [
    {
      id: 'a',
      label: 'A',
      scale: [0, 1, 2],
      questions: [
        { id: 'a-1', prompt: 'Question A1' },
        { id: 'a-2', prompt: 'Question A2' },
        { id: 'a-3', prompt: 'Question A3' },
      ],
    },
  ]
  return normalize(config)
}

function makeSkipSession(
  student = makeStudent(['pending']),
  skips: ParsedConfig['skips'] = {},
): Session {
  return makeSession({ config: makeSkipConfig(skips), students: [student] })
}

const input = { studentId: 'student-1', attemptId: 'attempt-1' }

describe('skipsRemaining', () => {
  test('quota plein', () => {
    expect(skipsRemaining(makeStudent(), makeSkipConfig({ maxPerStudent: 2 }))).toBe(2)
  })

  test('quota partiel', () => {
    const student = makeStudent([{ skipped: '' }, 1])
    expect(skipsRemaining(student, makeSkipConfig({ maxPerStudent: 2 }))).toBe(1)
  })

  test('quota épuisé', () => {
    const student = makeStudent([{ skipped: '' }])
    expect(skipsRemaining(student, makeSkipConfig({ maxPerStudent: 1 }))).toBe(0)
  })

  test('maxPerStudent = 0', () => {
    expect(skipsRemaining(makeStudent(), makeSkipConfig({ maxPerStudent: 0 }))).toBe(0)
  })

  test('skips désactivés', () => {
    expect(skipsRemaining(makeStudent(), makeSkipConfig({ enabled: false }))).toBe(0)
  })
})

describe('skipAttempt', () => {
  test('nominal sans motif : skipped, sans skipReason', () => {
    const result = skipAttempt(makeSkipSession(), input)

    const attempt = result.students[0]?.attempts[0]
    expect(attempt).toEqual({
      id: 'attempt-1',
      categoryId: 'a',
      questionId: 'a-1',
      drawnAt: '2026-09-25T09:00:00.000Z',
      outcome: 'skipped',
    })
    expect(attempt !== undefined && 'skipReason' in attempt).toBe(false)
  })

  test('motif prédéfini', () => {
    const session = makeSkipSession(undefined, { reasons: ['Déjà vue'], allowFreeText: false })

    const result = skipAttempt(session, { ...input, reason: 'Déjà vue' })

    expect(result.students[0]?.attempts[0]?.skipReason).toBe('Déjà vue')
  })

  test('motif libre, trimé', () => {
    const result = skipAttempt(makeSkipSession(), { ...input, reason: '  Hors programme  ' })

    expect(result.students[0]?.attempts[0]?.skipReason).toBe('Hors programme')
  })

  test('motif vide ou blanc → undefined', () => {
    const result = skipAttempt(makeSkipSession(), { ...input, reason: '   ' })

    const attempt = result.students[0]?.attempts[0]
    expect(attempt?.outcome).toBe('skipped')
    expect(attempt !== undefined && 'skipReason' in attempt).toBe(false)
  })

  test(`motif libre tronqué à ${MAX_SKIP_REASON_LENGTH} caractères`, () => {
    const reason = 'x'.repeat(MAX_SKIP_REASON_LENGTH + 50)

    const result = skipAttempt(makeSkipSession(), { ...input, reason })

    expect(result.students[0]?.attempts[0]?.skipReason).toBe(
      'x'.repeat(MAX_SKIP_REASON_LENGTH),
    )
  })

  test('student_not_found', () => {
    expectPassageError(
      () => skipAttempt(makeSkipSession(), { ...input, studentId: 'nope' }),
      'student_not_found',
    )
  })

  test('attempt_not_found', () => {
    expectPassageError(
      () => skipAttempt(makeSkipSession(), { ...input, attemptId: 'nope' }),
      'attempt_not_found',
    )
  })

  test('not_pending (attempt déjà scored)', () => {
    const session = makeSkipSession(makeStudent([1]))
    const snapshot = structuredClone(session)

    expectPassageError(() => skipAttempt(session, input), 'not_pending')
    expect(session).toEqual(snapshot)
  })

  test('not_pending (attempt déjà skipped)', () => {
    expectPassageError(
      () => skipAttempt(makeSkipSession(makeStudent([{ skipped: '' }])), input),
      'not_pending',
    )
  })

  test('skips_disabled', () => {
    const session = makeSkipSession(undefined, { enabled: false })
    const snapshot = structuredClone(session)

    expectPassageError(() => skipAttempt(session, input), 'skips_disabled')
    expect(session).toEqual(snapshot)
  })

  test('skip_quota_reached', () => {
    const session = makeSkipSession(makeStudent([{ skipped: '' }, 'pending']))
    const snapshot = structuredClone(session)

    expectPassageError(
      () => skipAttempt(session, { ...input, attemptId: 'attempt-2' }),
      'skip_quota_reached',
    )
    expect(session).toEqual(snapshot)
  })

  test('skip_quota_reached avec maxPerStudent = 0', () => {
    expectPassageError(
      () => skipAttempt(makeSkipSession(undefined, { maxPerStudent: 0 }), input),
      'skip_quota_reached',
    )
  })

  test('reason_not_allowed : motif libre refusé si allowFreeText est faux', () => {
    const session = makeSkipSession(undefined, { reasons: ['Déjà vue'], allowFreeText: false })
    const snapshot = structuredClone(session)

    expectPassageError(
      () => skipAttempt(session, { ...input, reason: 'Autre chose' }),
      'reason_not_allowed',
    )
    expect(session).toEqual(snapshot)
  })

  test('allowFreeText faux : un motif vide reste accepté', () => {
    const session = makeSkipSession(undefined, { reasons: ['Déjà vue'], allowFreeText: false })

    const result = skipAttempt(session, { ...input, reason: '' })

    expect(result.students[0]?.attempts[0]?.outcome).toBe('skipped')
  })

  test('un skip ne compte pas dans questionsPerStudent', () => {
    const session = makeSkipSession(makeStudent([1, 'pending']))
    const before = session.students[0]
    if (before === undefined) throw new Error('étudiant manquant')

    const result = skipAttempt(session, { ...input, attemptId: 'attempt-2' })
    const after = result.students[0]
    if (after === undefined) throw new Error('étudiant manquant')

    expect(studentStatus(after, result.config)).toBe('in_progress')
    expect(questionIndex(after, result.config)).toEqual(questionIndex(before, session.config))
  })

  test('la question skippée n’est plus tirable par cet étudiant', () => {
    const result = skipAttempt(makeSkipSession(), input)
    const student = result.students[0]
    const category = result.config.categories[0]
    if (student === undefined || category === undefined) throw new Error('fixture incomplète')

    const available = availableQuestions(student, category).map((q) => q.id)
    expect(available).toEqual(['a-2', 'a-3'])
  })
})
