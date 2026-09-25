import { formatPath, type IssuePath } from '@/domain/config/issues'
import type { Attempt, Session } from '@/domain/session/types'
import { backupError, type BackupRuleIssue } from './issues'

/** Premier chemin vu pour chaque id ; renvoie le premier chemin si l'id est déjà vu. */
function trackId(seen: Map<string, IssuePath>, id: string, path: IssuePath): IssuePath | undefined {
  const first = seen.get(id)
  if (first) return first
  seen.set(id, path)
  return undefined
}

function checkAttempt(attempt: Attempt, path: IssuePath, session: Session): BackupRuleIssue[] {
  const issues: BackupRuleIssue[] = []
  const category = session.config.categories.find((c) => c.id === attempt.categoryId)
  if (!category) {
    issues.push(
      backupError('unknown_category', [...path, 'categoryId'], { categoryId: attempt.categoryId }),
    )
  } else if (!category.questions.some((q) => q.id === attempt.questionId)) {
    issues.push(
      backupError('unknown_question', [...path, 'questionId'], {
        categoryId: attempt.categoryId,
        questionId: attempt.questionId,
      }),
    )
  }
  const hasScore = attempt.score !== undefined
  if (hasScore !== (attempt.outcome === 'scored')) {
    issues.push(backupError('score_mismatch', [...path, 'score'], { outcome: attempt.outcome }))
  } else if (attempt.score !== undefined && category && !category.scale.includes(attempt.score)) {
    issues.push(
      backupError('score_not_in_scale', [...path, 'score'], {
        score: attempt.score,
        scale: category.scale.join(', '),
      }),
    )
  }
  if (attempt.skipReason !== undefined && attempt.outcome !== 'skipped') {
    issues.push(backupError('skip_reason_mismatch', [...path, 'skipReason'], {}))
  }
  return issues
}

function checkStudent(
  student: Session['students'][number],
  studentPath: IssuePath,
  session: Session,
  studentIds: Map<string, IssuePath>,
  attemptIds: Map<string, IssuePath>,
): BackupRuleIssue[] {
  const issues: BackupRuleIssue[] = []
  const firstStudent = trackId(studentIds, student.id, [...studentPath, 'id'])
  if (firstStudent) {
    issues.push(
      backupError('duplicate_student_id', [...studentPath, 'id'], {
        id: student.id,
        firstPath: formatPath(firstStudent),
      }),
    )
  }
  if (student.absent && student.attempts.length > 0) {
    issues.push(backupError('absent_with_attempts', [...studentPath, 'attempts'], {}))
  }
  student.attempts.forEach((attempt, a) => {
    const attemptPath: IssuePath = [...studentPath, 'attempts', a]
    const firstAttempt = trackId(attemptIds, attempt.id, [...attemptPath, 'id'])
    if (firstAttempt) {
      issues.push(
        backupError('duplicate_attempt_id', [...attemptPath, 'id'], {
          id: attempt.id,
          firstPath: formatPath(firstAttempt),
        }),
      )
    }
    issues.push(...checkAttempt(attempt, attemptPath, session))
  })
  const pending = student.attempts.filter((attempt) => attempt.outcome === 'pending').length
  if (pending > 1)
    issues.push(backupError('multiple_pending', [...studentPath, 'attempts'], { count: pending }))
  return issues
}

function checkSessionLinks(
  session: Session,
  studentIds: Map<string, IssuePath>,
): BackupRuleIssue[] {
  const issues: BackupRuleIssue[] = []
  if (session.activeStudentId !== undefined && !studentIds.has(session.activeStudentId)) {
    issues.push(
      backupError('unknown_active_student', ['session', 'activeStudentId'], {
        studentId: session.activeStudentId,
      }),
    )
  }
  const { mode, studentId } = session.projection
  if ((mode === 'student') !== (studentId !== undefined)) {
    issues.push(backupError('projection_mismatch', ['session', 'projection'], {}))
  } else if (studentId !== undefined && !studentIds.has(studentId)) {
    issues.push(
      backupError('unknown_projected_student', ['session', 'projection', 'studentId'], {
        studentId,
      }),
    )
  }
  return issues
}

/** Cohérence entre la session et sa config figée (D48). La config doit déjà être validée. */
export function checkSessionRules(session: Session): BackupRuleIssue[] {
  const issues: BackupRuleIssue[] = []
  const studentIds = new Map<string, IssuePath>()
  const attemptIds = new Map<string, IssuePath>()
  session.students.forEach((student, s) => {
    const studentPath: IssuePath = ['session', 'students', s]
    issues.push(...checkStudent(student, studentPath, session, studentIds, attemptIds))
  })
  issues.push(...checkSessionLinks(session, studentIds))
  return issues
}
