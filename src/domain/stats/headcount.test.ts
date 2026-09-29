import { describe, expect, it } from 'vitest'
import { computeScores } from '@/domain/scoring/score'
import { studentStatus } from '@/domain/scoring/status'
import type { Student } from '@/domain/session/types'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { computeHeadcount } from './headcount'

describe('computeHeadcount', () => {
  it('compte un effectif par statut et les ajouts en cours de session', () => {
    const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 2, finalScale: 20 })
    const students: Student[] = [
      makeStudent([2], { id: 's1' }),
      makeStudent(['pending'], { id: 's2' }),
      makeStudent([], { id: 's3' }),
      makeStudent([], { id: 's4', absent: true }),
      makeStudent([], { id: 's5', absent: true, addedDuringSession: true }),
    ]
    const scored = students.map((student) => ({
      student,
      status: studentStatus(student, config),
      scores: computeScores(student, config),
    }))
    expect(computeHeadcount(scored)).toEqual({
      total: 5,
      done: 1,
      inProgress: 1,
      todo: 1,
      absent: 2,
      addedDuringSession: 1,
    })
  })
})
