import type { Session } from '@/domain/session/types'
import { PassageError } from './errors'
import { requireStudent } from './require-student'

/** Note un attempt `pending` (§7). La catégorie est retrouvée via `attempt.categoryId`. */
export function scoreAttempt(
  session: Session,
  input: { studentId: string; attemptId: string; score: number },
): Session {
  const student = requireStudent(session, input.studentId)

  const attempt = student.attempts.find((a) => a.id === input.attemptId)
  if (attempt === undefined) throw new PassageError('attempt_not_found')
  if (attempt.outcome !== 'pending') throw new PassageError('not_pending')

  const category = session.config.categories.find((c) => c.id === attempt.categoryId)
  if (category === undefined) throw new PassageError('category_not_found')
  if (!category.scale.includes(input.score)) throw new PassageError('score_not_in_scale')

  return {
    ...session,
    students: session.students.map((s) =>
      s.id === student.id
        ? {
            ...s,
            attempts: s.attempts.map((a) =>
              a.id === attempt.id ? { ...a, outcome: 'scored' as const, score: input.score } : a,
            ),
          }
        : s,
    ),
  }
}
