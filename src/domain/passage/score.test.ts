import { describe, expect, test } from 'vitest'
import type { Session } from '@/domain/session/types'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { scoreAttempt } from './score'

function makeScoreSession(
  student: ReturnType<typeof makeStudent> = makeStudent(['pending']),
): Session {
  return makeSession({ students: [student] })
}

describe('scoreAttempt', () => {
  test('nominal : note un attempt pending', () => {
    const session = makeScoreSession()

    const result = scoreAttempt(session, {
      studentId: 'student-1',
      attemptId: 'attempt-1',
      score: 1,
    })

    const attempt = result.students[0]?.attempts[0]
    expect(attempt).toEqual({
      id: 'attempt-1',
      categoryId: 'a',
      questionId: 'a-1',
      drawnAt: '2026-09-25T09:00:00.000Z',
      outcome: 'scored',
      score: 1,
    })
    expect(attempt !== undefined && 'editedAt' in attempt).toBe(false)
  })

  test('student_not_found', () => {
    const session = makeScoreSession()
    const snapshot = structuredClone(session)

    expectPassageError(
      () => scoreAttempt(session, { studentId: 'nope', attemptId: 'attempt-1', score: 1 }),
      'student_not_found',
    )
    expect(session).toEqual(snapshot)
  })

  test('attempt_not_found', () => {
    const session = makeScoreSession()
    const snapshot = structuredClone(session)

    expectPassageError(
      () => scoreAttempt(session, { studentId: 'student-1', attemptId: 'nope', score: 1 }),
      'attempt_not_found',
    )
    expect(session).toEqual(snapshot)
  })

  test('not_pending (attempt déjà scored)', () => {
    const session = makeScoreSession(makeStudent([1]))
    const snapshot = structuredClone(session)

    expectPassageError(
      () => scoreAttempt(session, { studentId: 'student-1', attemptId: 'attempt-1', score: 1 }),
      'not_pending',
    )
    expect(session).toEqual(snapshot)
  })

  test('score_not_in_scale', () => {
    const session = makeScoreSession()
    const snapshot = structuredClone(session)

    expectPassageError(
      () => scoreAttempt(session, { studentId: 'student-1', attemptId: 'attempt-1', score: 0.5 }),
      'score_not_in_scale',
    )
    expect(session).toEqual(snapshot)
  })

  // Branche défensive : inatteignable avec une config figée valide (F31), d'où la session forgée.
  test('category_not_found (attempt sur une catégorie absente de la config)', () => {
    const student = makeStudent(['pending'])
    const pending = student.attempts[0]!
    const session = makeScoreSession({ ...student, attempts: [{ ...pending, categoryId: 'zz' }] })
    const snapshot = structuredClone(session)

    expectPassageError(
      () => scoreAttempt(session, { studentId: 'student-1', attemptId: 'attempt-1', score: 1 }),
      'category_not_found',
    )
    expect(session).toEqual(snapshot)
  })
})
