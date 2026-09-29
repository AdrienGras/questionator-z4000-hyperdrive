import { describe, expect, test } from 'vitest'
import { computeScores } from '@/domain/scoring/score'
import { toMilli } from '@/domain/scoring/milli'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { editScore } from './edit-score'

const deps = { now: () => new Date('2026-09-29T11:00:00.000Z') }
const config = makeConfig({ questionsPerStudent: 3 })

describe('editScore', () => {
  test('remplace la note et pose editedAt', () => {
    const session = makeSession({ config, students: [makeStudent([1, 2])] })
    const snapshot = structuredClone(session)
    const result = editScore(
      session,
      { studentId: 'student-1', attemptId: 'attempt-1', score: 2 },
      deps,
    )
    const [first, second] = result.students[0]?.attempts ?? []
    expect(first).toMatchObject({ score: 2, editedAt: '2026-09-29T11:00:00.000Z' })
    expect(second).toEqual(session.students[0]?.attempts[1])
    expect(session).toEqual(snapshot)
  })

  test('même valeur : session renvoyée telle quelle', () => {
    const session = makeSession({ config, students: [makeStudent([1, 2])] })
    const result = editScore(
      session,
      { studentId: 'student-1', attemptId: 'attempt-1', score: 1 },
      deps,
    )
    expect(result).toBe(session)
  })

  test.each([
    ['skipped', [{ skipped: 'x' }] as const],
    ['pending', ['pending'] as const],
  ])('not_scored sur une question %s', (_label, attempts) => {
    const session = makeSession({ config, students: [makeStudent([...attempts])] })
    const snapshot = structuredClone(session)
    expectPassageError(
      () => editScore(session, { studentId: 'student-1', attemptId: 'attempt-1', score: 1 }, deps),
      'not_scored',
    )
    expect(session).toEqual(snapshot)
  })

  test('score_not_in_scale', () => {
    const session = makeSession({ config, students: [makeStudent([1, 2])] })
    const snapshot = structuredClone(session)
    expectPassageError(
      () =>
        editScore(session, { studentId: 'student-1', attemptId: 'attempt-1', score: 0.5 }, deps),
      'score_not_in_scale',
    )
    expect(session).toEqual(snapshot)
  })

  test('attempt_not_found', () => {
    const session = makeSession({ config, students: [makeStudent([1, 2])] })
    const snapshot = structuredClone(session)
    expectPassageError(
      () => editScore(session, { studentId: 'student-1', attemptId: 'nope', score: 1 }, deps),
      'attempt_not_found',
    )
    expect(session).toEqual(snapshot)
  })

  test('student_not_found', () => {
    const session = makeSession({ config, students: [makeStudent([1, 2])] })
    const snapshot = structuredClone(session)
    expectPassageError(
      () => editScore(session, { studentId: 'nope', attemptId: 'attempt-1', score: 1 }, deps),
      'student_not_found',
    )
    expect(session).toEqual(snapshot)
  })

  test('étudiant en cours : la question pending reste intacte', () => {
    const session = makeSession({ config, students: [makeStudent([1, 'pending'])] })
    const result = editScore(
      session,
      { studentId: 'student-1', attemptId: 'attempt-1', score: 2 },
      deps,
    )
    const attempts = result.students[0]?.attempts ?? []
    expect(attempts[0]?.score).toBe(2)
    expect(attempts[1]).toEqual(session.students[0]?.attempts[1])
    expect(attempts[1]?.outcome).toBe('pending')
  })

  test('étudiant terminé : la note finale est recalculée', () => {
    const doneConfig = makeConfig({
      questionsPerStudent: 2,
      maxRawScore: 4,
      finalScale: 20,
      rounding: { mode: 'nearest', decimals: 2, step: 0.5 },
    })
    const student = makeStudent([1, 1])
    const session = makeSession({ config: doneConfig, students: [student] })
    const result = editScore(
      session,
      { studentId: 'student-1', attemptId: 'attempt-1', score: 2 },
      deps,
    )
    const edited = result.students[0]
    if (edited === undefined) throw new Error('étudiant manquant')
    expect(computeScores(student, doneConfig).final).toBe(toMilli(10))
    expect(computeScores(edited, doneConfig).final).toBe(toMilli(15))
  })
})
