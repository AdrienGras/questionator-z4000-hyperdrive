import { describe, expect, test } from 'vitest'
import { makeSession } from '@/test/session-fixtures'
import { makeStudent } from '@/test/student-fixtures'
import { sessionProgress } from './progress'

describe('sessionProgress', () => {
  test('compte passés, absents et restants (en cours compris)', () => {
    const session = makeSession({
      students: [
        makeStudent([2], { id: 'done' }),
        makeStudent(['pending'], { id: 'in-progress' }),
        makeStudent([], { id: 'todo' }),
        makeStudent([], { id: 'absent', absent: true }),
      ],
    })
    expect(sessionProgress(session)).toEqual({ done: 1, absent: 1, remaining: 2, total: 4 })
  })

  test('session sans étudiant : tout à zéro', () => {
    expect(sessionProgress(makeSession({ students: [] }))).toEqual({
      done: 0,
      absent: 0,
      remaining: 0,
      total: 0,
    })
  })
})
