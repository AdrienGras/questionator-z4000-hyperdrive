import { describe, expect, test } from 'vitest'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { goToNextStudent, setActiveStudent } from './active-student'

describe('setActiveStudent', () => {
  test("nominal : change l'étudiant actif, le reste est intact", () => {
    const session = makeSession()

    const result = setActiveStudent(session, 'student-1')

    expect(result.activeStudentId).toBe('student-1')
    expect(result.students).toEqual(session.students)
    expect(result.config).toEqual(session.config)
  })

  test('un autre étudiant projeté : la projection repasse en attente (D73)', () => {
    const session = makeSession({
      activeStudentId: 'student-1',
      projection: { mode: 'student', studentId: 'student-1' },
      students: [makeStudent([], { id: 'student-1' }), makeStudent([], { id: 'autre' })],
    })

    const result = setActiveStudent(session, 'autre')

    expect(result.activeStudentId).toBe('autre')
    expect(result.projection).toEqual({ mode: 'waiting' })
  })

  test('projection en attente : inchangée', () => {
    const session = makeSession({
      activeStudentId: 'student-1',
      projection: { mode: 'waiting' },
      students: [makeStudent([], { id: 'student-1' }), makeStudent([], { id: 'autre' })],
    })

    expect(setActiveStudent(session, 'autre').projection).toBe(session.projection)
  })

  test('nouvel actif déjà projeté : projection inchangée', () => {
    const session = makeSession({
      activeStudentId: 'student-1',
      projection: { mode: 'student', studentId: 'autre' },
      students: [makeStudent([], { id: 'student-1' }), makeStudent([], { id: 'autre' })],
    })

    const result = setActiveStudent(session, 'autre')

    expect(result.activeStudentId).toBe('autre')
    expect(result.projection).toBe(session.projection)
  })

  test("déjà actif : session renvoyée telle quelle (pas d'écriture inutile)", () => {
    const session = makeSession({ activeStudentId: 'student-1' })

    expect(setActiveStudent(session, 'student-1')).toBe(session)
  })

  test('student_not_found', () => {
    const session = makeSession()
    const snapshot = structuredClone(session)

    expectPassageError(() => setActiveStudent(session, 'nope'), 'student_not_found')
    expect(session).toEqual(snapshot)
  })
})

describe('goToNextStudent', () => {
  const config = makeConfig({ questionsPerStudent: 1 })

  const students = [
    makeStudent([10], { id: 's1', order: 1 }),
    makeStudent([], { id: 's2', order: 2 }),
  ]

  test("nominal : l'étudiant actif devient le suivant, attente intacte", () => {
    const session = makeSession({
      config,
      activeStudentId: 's1',
      projection: { mode: 'waiting' },
      students,
    })

    const result = goToNextStudent(session, 's1')

    expect(result.activeStudentId).toBe('s2')
    expect(result.projection).toBe(session.projection)
  })

  test('étudiant précédent projeté : la projection repasse en attente (D73)', () => {
    const session = makeSession({
      config,
      activeStudentId: 's1',
      projection: { mode: 'student', studentId: 's1' },
      students,
    })

    const result = goToNextStudent(session, 's1')

    expect(result.activeStudentId).toBe('s2')
    expect(result.projection).toEqual({ mode: 'waiting' })
  })

  test('suivant déjà projeté : projection inchangée', () => {
    const session = makeSession({
      config,
      activeStudentId: 's1',
      projection: { mode: 'student', studentId: 's2' },
      students,
    })

    expect(goToNextStudent(session, 's1').projection).toBe(session.projection)
  })

  test('no_next_student : session intacte', () => {
    const session = makeSession({
      config,
      students: [makeStudent([10], { id: 's1', order: 1 })],
    })
    const snapshot = structuredClone(session)

    expectPassageError(() => goToNextStudent(session, 's1'), 'no_next_student')
    expect(session).toEqual(snapshot)
  })
})
