import { describe, expect, test } from 'vitest'
import type { NormalizedCategory } from '@/domain/config/normalize'
import type { Session } from '@/domain/session/types'
import { expectPassageError } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { drawQuestion, type DrawDeps } from './draw'

/** Catégorie `a` à 2 questions (la fixture par défaut n'en a qu'une). */
const category: NormalizedCategory = {
  id: 'a',
  label: 'A',
  scale: [0, 1, 2],
  order: 1,
  questions: [
    { id: 'a-1', title: 'Q1', tags: [], prompt: 'Prompt 1' },
    { id: 'a-2', title: 'Q2', tags: [], prompt: 'Prompt 2' },
  ],
}

function makeDrawSession(
  student: ReturnType<typeof makeStudent> = makeStudent(),
  questionsPerStudent = 2,
): Session {
  const config = makeConfig({ questionsPerStudent })
  return makeSession({ config: { ...config, categories: [category] }, students: [student] })
}

const deps: DrawDeps = {
  random: () => 0,
  newId: () => 'att-new',
  now: () => new Date('2026-09-27T10:00:00.000Z'),
}

describe('drawQuestion', () => {
  test('nominal : ajoute un attempt pending, random reçoit le nombre de disponibles', () => {
    const session = makeDrawSession()
    let received = -1
    const localDeps: DrawDeps = {
      ...deps,
      random: (n) => {
        received = n
        return 0
      },
    }

    const result = drawQuestion(session, { studentId: 'student-1', categoryId: 'a' }, localDeps)

    expect(received).toBe(2)
    expect(session.students[0]?.attempts).toEqual([])
    expect(result.students[0]?.attempts).toEqual([
      {
        id: 'att-new',
        categoryId: 'a',
        questionId: 'a-1',
        drawnAt: '2026-09-27T10:00:00.000Z',
        outcome: 'pending',
      },
    ])
  })

  test('tirage parmi les disponibles seulement', () => {
    const student = makeStudent([1]) // a-1 déjà scored
    const session = makeDrawSession(student)
    let received = -1
    const localDeps: DrawDeps = {
      ...deps,
      random: (n) => {
        received = n
        return n - 1
      },
    }

    const result = drawQuestion(session, { studentId: 'student-1', categoryId: 'a' }, localDeps)

    expect(received).toBe(1)
    expect(result.students[0]?.attempts.at(-1)?.questionId).toBe('a-2')
  })

  test('student_not_found', () => {
    const session = makeDrawSession()
    const snapshot = structuredClone(session)

    expectPassageError(
      () => drawQuestion(session, { studentId: 'nope', categoryId: 'a' }, deps),
      'student_not_found',
    )
    expect(session).toEqual(snapshot)
  })

  test('student_absent (absent et pending → student_absent)', () => {
    const student = makeStudent(['pending'], { absent: true })
    const session = makeDrawSession(student)
    const snapshot = structuredClone(session)

    expectPassageError(
      () => drawQuestion(session, { studentId: 'student-1', categoryId: 'a' }, deps),
      'student_absent',
    )
    expect(session).toEqual(snapshot)
  })

  test('student_done', () => {
    const student = makeStudent([1, 1]) // scored === questionsPerStudent (2)
    const session = makeDrawSession(student)
    const snapshot = structuredClone(session)

    expectPassageError(
      () => drawQuestion(session, { studentId: 'student-1', categoryId: 'a' }, deps),
      'student_done',
    )
    expect(session).toEqual(snapshot)
  })

  test('pending_exists', () => {
    const student = makeStudent(['pending'])
    const session = makeDrawSession(student)
    const snapshot = structuredClone(session)

    expectPassageError(
      () => drawQuestion(session, { studentId: 'student-1', categoryId: 'a' }, deps),
      'pending_exists',
    )
    expect(session).toEqual(snapshot)
  })

  test('category_not_found', () => {
    const session = makeDrawSession()
    const snapshot = structuredClone(session)

    expectPassageError(
      () => drawQuestion(session, { studentId: 'student-1', categoryId: 'nope' }, deps),
      'category_not_found',
    )
    expect(session).toEqual(snapshot)
  })

  test('category_exhausted', () => {
    const student = makeStudent([1, 1]) // a-1 et a-2 scored, mais pas done (questionsPerStudent: 3)
    const session = makeDrawSession(student, 3)
    const snapshot = structuredClone(session)

    expectPassageError(
      () => drawQuestion(session, { studentId: 'student-1', categoryId: 'a' }, deps),
      'category_exhausted',
    )
    expect(session).toEqual(snapshot)
  })
})
