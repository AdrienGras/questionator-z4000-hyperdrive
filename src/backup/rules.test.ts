import { describe, expect, test } from 'vitest'
import type { Session } from '../domain/types'
import { makeSession } from '../test/session-fixtures'
import { makeStudent } from '../test/student-fixtures'
import { checkSessionRules } from './rules'

function codes(session: Session) {
  return checkSessionRules(session).map((issue) => issue.code)
}

describe('checkSessionRules', () => {
  test('session cohérente : aucune issue', () => {
    const session = makeSession({
      students: [makeStudent([2]), makeStudent([], { id: 'student-2', order: 2, absent: true })],
      activeStudentId: 'student-1',
      projection: { mode: 'student', studentId: 'student-1' },
    })
    expect(checkSessionRules(session)).toEqual([])
  })

  test('catégorie inconnue', () => {
    const session = makeSession({ students: [makeStudent([1])] })
    session.students[0]!.attempts[0]!.categoryId = 'zz'
    expect(checkSessionRules(session)).toEqual([
      {
        severity: 'error',
        code: 'unknown_category',
        path: ['session', 'students', 0, 'attempts', 0, 'categoryId'],
        params: { categoryId: 'zz' },
      },
    ])
  })

  test('question inconnue', () => {
    const session = makeSession({ students: [makeStudent([1])] })
    session.students[0]!.attempts[0]!.questionId = 'a-99'
    expect(codes(session)).toEqual(['unknown_question'])
  })

  test('score hors barème', () => {
    expect(codes(makeSession({ students: [makeStudent([1.5])] }))).toEqual(['score_not_in_scale'])
  })

  test('score absent sur scored, présent sur pending', () => {
    const session = makeSession({ students: [makeStudent([1, 'pending'])] })
    // makeStudent dérive questionId de l'index ('a-2') ; minimalConfig n'a que 'a-1'.
    // On le fixe pour isoler score_mismatch sans unknown_question parasite.
    session.students[0]!.attempts[1]!.questionId = 'a-1'
    delete session.students[0]!.attempts[0]!.score
    session.students[0]!.attempts[1]!.score = 1
    expect(codes(session)).toEqual(['score_mismatch', 'score_mismatch'])
  })

  test('skipReason hors skipped', () => {
    const session = makeSession({ students: [makeStudent([1])] })
    session.students[0]!.attempts[0]!.skipReason = 'x'
    expect(codes(session)).toEqual(['skip_reason_mismatch'])
  })

  test('deux pending pour un étudiant', () => {
    // makeStudent génère des id d'attempt distincts (attempt-1, attempt-2)
    const session = makeSession({ students: [makeStudent(['pending', 'pending'])] })
    // Même correctif que ci-dessus : questionId dérivé de l'index, on le ramène à 'a-1'.
    session.students[0]!.attempts[1]!.questionId = 'a-1'
    expect(codes(session)).toEqual(['multiple_pending'])
  })

  test('absent avec attempts', () => {
    expect(codes(makeSession({ students: [makeStudent([1], { absent: true })] }))).toEqual([
      'absent_with_attempts',
    ])
  })

  test('id étudiant en double', () => {
    const session = makeSession({ students: [makeStudent(), makeStudent([], { order: 2 })] })
    expect(checkSessionRules(session)).toEqual([
      {
        severity: 'error',
        code: 'duplicate_student_id',
        path: ['session', 'students', 1, 'id'],
        params: { id: 'student-1', firstPath: 'session.students[0].id' },
      },
    ])
  })

  test("id d'attempt en double, entre deux étudiants", () => {
    const session = makeSession({
      students: [makeStudent([1]), makeStudent([2], { id: 'student-2', order: 2 })],
    })
    expect(codes(session)).toEqual(['duplicate_attempt_id'])
  })

  test('étudiant actif inconnu', () => {
    expect(codes(makeSession({ activeStudentId: 'ghost' }))).toEqual(['unknown_active_student'])
  })

  test('étudiant projeté inconnu', () => {
    expect(codes(makeSession({ projection: { mode: 'student', studentId: 'ghost' } }))).toEqual([
      'unknown_projected_student',
    ])
  })

  test('projection incohérente', () => {
    expect(codes(makeSession({ projection: { mode: 'student' } }))).toEqual(['projection_mismatch'])
    expect(codes(makeSession({ projection: { mode: 'waiting', studentId: 'student-1' } }))).toEqual(
      ['projection_mismatch'],
    )
  })

  test('collecte plusieurs issues', () => {
    expect(
      codes(makeSession({ activeStudentId: 'ghost', projection: { mode: 'student' } })),
    ).toEqual(['unknown_active_student', 'projection_mismatch'])
  })
})
