import { describe, expect, test } from 'vitest'
import type { Session } from '@/domain/session/types'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { revealFinal } from './reveal'

const config = makeConfig({ questionsPerStudent: 1 })
const deps = { now: () => new Date('2026-09-29T10:00:00.000Z') }

function sessionOf(student = makeStudent([1])): Session {
  return makeSession({ config, students: [student] })
}

describe('revealFinal', () => {
  test('nominal', () => {
    const session = sessionOf()
    const snapshot = structuredClone(session)
    const result = revealFinal(session, { studentId: 'student-1' }, deps)
    expect(result.students[0]?.finalRevealedAt).toBe('2026-09-29T10:00:00.000Z')
    expect(session).toEqual(snapshot)
  })

  test('idempotent : la première date fait foi', () => {
    const session = sessionOf(makeStudent([1], { finalRevealedAt: '2026-09-28T08:00:00.000Z' }))
    const result = revealFinal(session, { studentId: 'student-1' }, deps)
    expect(result.students[0]?.finalRevealedAt).toBe('2026-09-28T08:00:00.000Z')
  })

  test('student_not_done', () => {
    const session = sessionOf(makeStudent(['pending']))
    const snapshot = structuredClone(session)
    expectPassageError(
      () => revealFinal(session, { studentId: 'student-1' }, deps),
      'student_not_done',
    )
    expect(session).toEqual(snapshot)
  })

  test('student_not_found', () => {
    const session = sessionOf()
    const snapshot = structuredClone(session)
    expectPassageError(() => revealFinal(session, { studentId: 'nope' }, deps), 'student_not_found')
    expect(session).toEqual(snapshot)
  })
})
