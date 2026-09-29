import { describe, expect, test } from 'vitest'
import { studentStatus } from '@/domain/scoring/status'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { setAbsent } from './absent'

const config = makeConfig({ questionsPerStudent: 2 })

describe('setAbsent', () => {
  test('déclarer absent efface le passage, garde le commentaire ; décocher rend « à passer »', () => {
    const student = makeStudent([2, 1], {
      adjustment: { value: 1 },
      finalRevealedAt: '2026-09-29T10:00:00.000Z',
      comment: 'Retard',
    })
    const session = makeSession({ config, students: [student] })
    const snapshot = structuredClone(session)
    const absent = setAbsent(session, { studentId: 'student-1', absent: true }).students[0]
    if (absent === undefined) throw new Error('étudiant manquant')
    expect(absent.absent).toBe(true)
    expect(absent.attempts).toEqual([])
    expect('adjustment' in absent).toBe(false)
    expect('finalRevealedAt' in absent).toBe(false)
    expect(absent.comment).toBe('Retard')
    expect(studentStatus(absent, config)).toBe('absent')
    expect(session).toEqual(snapshot)

    const back = setAbsent(makeSession({ config, students: [absent] }), {
      studentId: 'student-1',
      absent: false,
    }).students[0]
    if (back === undefined) throw new Error('étudiant manquant')
    expect(back.absent).toBe(false)
    expect(studentStatus(back, config)).toBe('todo')
    expect(back.comment).toBe('Retard')
  })

  test('sans attempt : seul absent change', () => {
    const session = makeSession({ config, students: [makeStudent([])] })
    const result = setAbsent(session, { studentId: 'student-1', absent: true })
    expect(result.students[0]).toEqual({ ...session.students[0], absent: true })
  })

  test('même valeur : session renvoyée telle quelle', () => {
    const session = makeSession({ config, students: [makeStudent([1])] })
    expect(setAbsent(session, { studentId: 'student-1', absent: false })).toBe(session)
  })

  test('student_not_found', () => {
    const session = makeSession({ config, students: [makeStudent([])] })
    const snapshot = structuredClone(session)
    expectPassageError(
      () => setAbsent(session, { studentId: 'nope', absent: true }),
      'student_not_found',
    )
    expect(session).toEqual(snapshot)
  })
})
