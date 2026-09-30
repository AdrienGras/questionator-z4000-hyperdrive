import { describe, expect, test } from 'vitest'
import type { Session } from '@/domain/session/types'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { addStudent } from './add-student'

const deps = { newId: () => 'new-id' }
const input = { lastName: 'Martin', firstName: 'Bob', activate: false }

function twoStudents() {
  return makeSession({
    students: [makeStudent([], { id: 's1', order: 0 }), makeStudent([], { id: 's2', order: 5 })],
    projection: { mode: 'student', studentId: 's1' },
  })
}

describe('addStudent', () => {
  test('ajoute un étudiant en dernier, avec order max + 1 et un passage vierge', () => {
    const result = addStudent(twoStudents(), input, deps)

    const added = result.students[2]
    expect(result.students).toHaveLength(3)
    expect(added).toMatchObject({
      id: 'new-id',
      lastName: 'Martin',
      firstName: 'Bob',
      order: 6,
      addedDuringSession: true,
      absent: false,
      attempts: [],
    })
    expect(added).not.toHaveProperty('comment')
    expect(added).not.toHaveProperty('adjustment')
    expect(added).not.toHaveProperty('finalRevealedAt')
  })

  test('session sans étudiant : order 0', () => {
    const result = addStudent(makeSession({ students: [] }), input, deps)
    expect(result.students[0]?.order).toBe(0)
  })

  test('les noms sont rognés', () => {
    const result = addStudent(
      twoStudents(),
      { lastName: '  Durand ', firstName: ' Alice  ', activate: false },
      deps,
    )
    expect(result.students[2]).toMatchObject({ lastName: 'Durand', firstName: 'Alice' })
  })

  test.each([
    { lastName: '   ', firstName: 'Bob' },
    { lastName: 'Martin', firstName: '' },
  ])('student_name_required : %o', (names) => {
    const session = twoStudents()
    const snapshot = structuredClone(session)
    expectPassageError(
      () => addStudent(session, { ...names, activate: false }, deps),
      'student_name_required',
    )
    expect(session).toEqual(snapshot)
  })

  test("activate: false laisse l'étudiant actif inchangé", () => {
    const session = { ...twoStudents(), activeStudentId: 's1' }
    const result = addStudent(session, { ...input, activate: false }, deps)
    expect(result.activeStudentId).toBe('s1')
    expect(result.projection).toEqual(session.projection)
  })

  test('activate: true rend le nouvel étudiant actif et remet la projection en attente (D73)', () => {
    const session: Session = {
      ...twoStudents(),
      activeStudentId: 's1',
      projection: { mode: 'student', studentId: 's1' },
    }
    const result = addStudent(session, { ...input, activate: true }, deps)
    expect(result.activeStudentId).toBe('new-id')
    expect(result.projection).toEqual({ mode: 'waiting' })
  })

  test('activate: false laisse la projection sur l’étudiant projeté', () => {
    const session: Session = {
      ...twoStudents(),
      activeStudentId: 's1',
      projection: { mode: 'student', studentId: 's1' },
    }
    const result = addStudent(session, { ...input, activate: false }, deps)
    expect(result.projection).toBe(session.projection)
  })

  test('la session reçue n’est pas modifiée', () => {
    const session = twoStudents()
    const snapshot = structuredClone(session)
    addStudent(session, { ...input, activate: true }, deps)
    expect(session).toEqual(snapshot)
  })
})
