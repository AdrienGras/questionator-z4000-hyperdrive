import { describe, expect, test } from 'vitest'
import { makeSession } from '@/testing/session-fixtures'
import { setActiveStudent } from './active-student'
import { PassageError, type PassageErrorCode } from './errors'

function expectPassageError(fn: () => unknown, code: PassageErrorCode): void {
  let caught: unknown
  expect(() => {
    try {
      fn()
    } catch (error) {
      caught = error
      throw error
    }
  }).toThrow(PassageError)
  if (!(caught instanceof PassageError)) throw new Error('Erreur inattendue')
  expect(caught.code).toBe(code)
}

describe('setActiveStudent', () => {
  test("nominal : change l'étudiant actif, le reste est intact", () => {
    const session = makeSession()

    const result = setActiveStudent(session, 'student-1')

    expect(result.activeStudentId).toBe('student-1')
    expect(result.students).toEqual(session.students)
    expect(result.config).toEqual(session.config)
  })

  test('student_not_found', () => {
    const session = makeSession()
    const snapshot = structuredClone(session)

    expectPassageError(() => setActiveStudent(session, 'nope'), 'student_not_found')
    expect(session).toEqual(snapshot)
  })
})
