import type { Session } from '@/domain/session/types'
import { PassageError } from './errors'
import { requireStudent } from './require-student'

export type EditScoreDeps = { now: () => Date }

/**
 * Corrige la note d'une question déjà notée (F12). Aucun contrôle de statut : un étudiant terminé
 * ou en cours se corrige. Une note identique renvoie la session telle quelle ; sinon `editedAt`
 * est posé.
 */
export function editScore(
  session: Session,
  input: { studentId: string; attemptId: string; score: number },
  deps: EditScoreDeps,
): Session {
  const student = requireStudent(session, input.studentId)

  const attempt = student.attempts.find((a) => a.id === input.attemptId)
  if (attempt === undefined) throw new PassageError('attempt_not_found')
  if (attempt.outcome !== 'scored') throw new PassageError('not_scored')

  const category = session.config.categories.find((c) => c.id === attempt.categoryId)
  if (category === undefined) throw new PassageError('category_not_found')
  if (!category.scale.includes(input.score)) throw new PassageError('score_not_in_scale')

  if (input.score === attempt.score) return session

  const editedAt = deps.now().toISOString()
  return {
    ...session,
    students: session.students.map((s) =>
      s.id === student.id
        ? {
            ...s,
            attempts: s.attempts.map((a) =>
              a.id === attempt.id ? { ...a, score: input.score, editedAt } : a,
            ),
          }
        : s,
    ),
  }
}
