import { describe, expect, test } from 'vitest'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { requireStudent } from './require-student'

describe('requireStudent', () => {
  test('renvoie l’étudiant demandé', () => {
    const session = makeSession()

    expect(requireStudent(session, 'student-1')).toBe(session.students[0])
  })

  test('student_not_found', () => {
    expectPassageError(() => requireStudent(makeSession(), 'nope'), 'student_not_found')
  })
})
