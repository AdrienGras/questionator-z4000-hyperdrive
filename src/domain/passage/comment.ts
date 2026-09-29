import type { Session } from '@/domain/session/types'
import { requireStudent } from './require-student'

/**
 * Pose le commentaire d'un étudiant (F12), trimé ; vide, la clé `comment` disparaît. Un commentaire
 * identique à celui stocké renvoie la session telle quelle. Pas de limite de longueur.
 */
export function setComment(
  session: Session,
  input: { studentId: string; comment: string },
): Session {
  const student = requireStudent(session, input.studentId)
  const comment = input.comment.trim()
  if (comment === (student.comment ?? '')) return session

  const { comment: _previous, ...rest } = student
  const updated = comment === '' ? rest : { ...rest, comment }
  return {
    ...session,
    students: session.students.map((s) => (s.id === student.id ? updated : s)),
  }
}
