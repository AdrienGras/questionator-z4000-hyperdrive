import { describe, expect, test } from 'vitest'
import { computeScores } from '@/domain/scoring/score'
import { toMilli } from '@/domain/scoring/milli'
import type { Session } from '@/domain/session/types'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { setAdjustment } from './adjust'

const config = makeConfig({
  questionsPerStudent: 1,
  maxRawScore: 20,
  finalScale: 20,
  rounding: { mode: 'nearest', decimals: 2, step: 0.5 },
})

function sessionOf(student = makeStudent([20])): Session {
  return makeSession({ config, students: [student] })
}

function adjusted(session: Session) {
  return session.students[0]?.adjustment
}

describe('setAdjustment', () => {
  test('nominal, justification normalisée', () => {
    const result = setAdjustment(sessionOf(), {
      studentId: 'student-1',
      value: 1,
      reason: '  Bonus oral  ',
    })
    expect(adjusted(result)).toEqual({ value: 1, reason: 'Bonus oral' })
  })

  test('sans justification : pas de clé reason', () => {
    const result = setAdjustment(sessionOf(), { studentId: 'student-1', value: -0.5 })
    const adjustment = adjusted(result)
    expect(adjustment).toEqual({ value: -0.5 })
    expect(adjustment !== undefined && 'reason' in adjustment).toBe(false)
  })

  test('0 supprime l’ajustement', () => {
    const session = sessionOf(makeStudent([20], { adjustment: { value: 1, reason: 'x' } }))
    const result = setAdjustment(session, { studentId: 'student-1', value: 0, reason: 'y' })
    expect(result.students[0] && 'adjustment' in result.students[0]).toBe(false)
  })

  test('ne mute pas l’entrée', () => {
    const session = sessionOf()
    const snapshot = structuredClone(session)
    setAdjustment(session, { studentId: 'student-1', value: 1 })
    expect(session).toEqual(snapshot)
  })

  test.each([
    { attempts: [20], value: 1, expected: 20 },
    { attempts: [0], value: -1, expected: 0 },
    { attempts: [13.5], value: 1, expected: 14.5 },
  ])('moteur : $attempts + $value', ({ attempts, value, expected }) => {
    const result = setAdjustment(sessionOf(makeStudent(attempts)), {
      studentId: 'student-1',
      value,
    })
    const student = result.students[0]
    if (student === undefined) throw new Error('étudiant manquant')
    expect(computeScores(student, config).final).toBe(toMilli(expected))
  })

  test.each([0.3, 20.5])('adjustment_invalid pour %s', (value) => {
    const session = sessionOf()
    const snapshot = structuredClone(session)
    expectPassageError(
      () => setAdjustment(session, { studentId: 'student-1', value }),
      'adjustment_invalid',
    )
    expect(session).toEqual(snapshot)
  })

  test.each([
    ['en cours', makeStudent(['pending'])],
    ['absent', makeStudent([], { absent: true })],
  ])('student_not_done : %s', (_label, student) => {
    const session = sessionOf(student)
    const snapshot = structuredClone(session)
    expectPassageError(
      () => setAdjustment(session, { studentId: 'student-1', value: 1 }),
      'student_not_done',
    )
    expect(session).toEqual(snapshot)
  })

  test('student_not_found', () => {
    const session = sessionOf()
    const snapshot = structuredClone(session)
    expectPassageError(
      () => setAdjustment(session, { studentId: 'nope', value: 1 }),
      'student_not_found',
    )
    expect(session).toEqual(snapshot)
  })
})
