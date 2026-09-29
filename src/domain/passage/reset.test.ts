import { describe, expect, test } from 'vitest'
import { studentStatus } from '@/domain/scoring/status'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { resetStudent } from './reset'

const config = makeConfig({ questionsPerStudent: 3 })

describe('resetStudent', () => {
  test('vide attempts, adjustment et finalRevealedAt ; garde comment', () => {
    const student = makeStudent([2, { skipped: 'x' }, 1], {
      adjustment: { value: 1, reason: 'r' },
      finalRevealedAt: '2026-09-29T10:00:00.000Z',
      comment: 'Tiers-temps',
    })
    const session = makeSession({ config, students: [student] })
    const snapshot = structuredClone(session)
    const result = resetStudent(session, 'student-1')
    const reset = result.students[0]
    if (reset === undefined) throw new Error('étudiant manquant')
    expect(reset.attempts).toEqual([])
    expect('adjustment' in reset).toBe(false)
    expect('finalRevealedAt' in reset).toBe(false)
    expect(reset.comment).toBe('Tiers-temps')
    expect(studentStatus(reset, config)).toBe('todo')
    expect(session).toEqual(snapshot)
  })

  test('conserve absent, activeStudentId et projection', () => {
    const session = makeSession({
      config,
      students: [makeStudent([], { absent: true })],
      activeStudentId: 'student-1',
    })
    const result = resetStudent(session, 'student-1')
    expect(result.students[0]?.absent).toBe(true)
    expect(result.activeStudentId).toBe(session.activeStudentId)
    expect(result.projection).toEqual(session.projection)
  })

  test('student_not_found', () => {
    const session = makeSession({ config, students: [makeStudent([1])] })
    const snapshot = structuredClone(session)
    expectPassageError(() => resetStudent(session, 'nope'), 'student_not_found')
    expect(session).toEqual(snapshot)
  })
})
