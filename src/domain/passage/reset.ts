import type { Session } from '@/domain/session/types'
import { requireStudent } from './require-student'

/**
 * Remet un étudiant à zéro (F11) : attempts, ajustement et révélation sont effacés ; le
 * commentaire et l'absence sont conservés (D07). Valable dans tout statut.
 */
export function resetStudent(session: Session, studentId: string): Session {
  const student = requireStudent(session, studentId)
  const { adjustment: _adjustment, finalRevealedAt: _revealed, ...rest } = student
  const reset = { ...rest, attempts: [] }
  return {
    ...session,
    students: session.students.map((s) => (s.id === student.id ? reset : s)),
  }
}
