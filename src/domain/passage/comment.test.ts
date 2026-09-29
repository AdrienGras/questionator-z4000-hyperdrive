import { describe, expect, test } from 'vitest'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { setComment } from './comment'

const config = makeConfig({ questionsPerStudent: 3 })

describe('setComment', () => {
  test('pose le commentaire trimé', () => {
    const session = makeSession({ config, students: [makeStudent([])] })
    const snapshot = structuredClone(session)
    const result = setComment(session, { studentId: 'student-1', comment: '  Tiers-temps  ' })
    expect(result.students[0]?.comment).toBe('Tiers-temps')
    expect(session).toEqual(snapshot)
  })

  test('commentaire blanc : la clé comment disparaît', () => {
    const session = makeSession({ config, students: [makeStudent([], { comment: 'Retard' })] })
    const result = setComment(session, { studentId: 'student-1', comment: '   ' })
    expect(result.students[0] !== undefined && 'comment' in result.students[0]).toBe(false)
  })

  test('même commentaire après trim : session renvoyée telle quelle', () => {
    const session = makeSession({ config, students: [makeStudent([], { comment: 'Retard' })] })
    expect(setComment(session, { studentId: 'student-1', comment: ' Retard ' })).toBe(session)
  })

  test('vide sur un étudiant sans commentaire : session renvoyée telle quelle', () => {
    const session = makeSession({ config, students: [makeStudent([])] })
    expect(setComment(session, { studentId: 'student-1', comment: '' })).toBe(session)
  })

  test('student_not_found', () => {
    const session = makeSession({ config, students: [makeStudent([])] })
    const snapshot = structuredClone(session)
    expectPassageError(
      () => setComment(session, { studentId: 'nope', comment: 'x' }),
      'student_not_found',
    )
    expect(session).toEqual(snapshot)
  })
})
