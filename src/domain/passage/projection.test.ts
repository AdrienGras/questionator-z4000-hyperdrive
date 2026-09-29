import { describe, expect, test } from 'vitest'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { setProjection } from './projection'

describe('setProjection', () => {
  test('waiting : la clé studentId n’est pas conservée', () => {
    const session = makeSession({ projection: { mode: 'student', studentId: 'student-1' } })
    const result = setProjection(session, { mode: 'waiting' })
    expect(result.projection).toEqual({ mode: 'waiting' })
    expect('studentId' in result.projection).toBe(false)
  })

  test('student : projette l’étudiant', () => {
    const session = makeSession({ students: [makeStudent()] })
    expect(setProjection(session, { mode: 'student', studentId: 'student-1' }).projection).toEqual({
      mode: 'student',
      studentId: 'student-1',
    })
  })

  test('student inconnu : student_not_found', () => {
    const session = makeSession()
    const snapshot = structuredClone(session)
    expectPassageError(
      () => setProjection(session, { mode: 'student', studentId: 'inconnu' }),
      'student_not_found',
    )
    expect(session).toEqual(snapshot)
  })

  test('même projection : session renvoyée telle quelle', () => {
    const waiting = makeSession()
    expect(setProjection(waiting, { mode: 'waiting' })).toBe(waiting)
    const student = makeSession({ projection: { mode: 'student', studentId: 'student-1' } })
    expect(setProjection(student, { mode: 'student', studentId: 'student-1' })).toBe(student)
  })

  test('entrée non modifiée', () => {
    const session = makeSession()
    const snapshot = structuredClone(session)
    setProjection(session, { mode: 'student', studentId: 'student-1' })
    expect(session).toEqual(snapshot)
  })
})
