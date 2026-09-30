import type { Session } from '@/domain/session/types'
import { PassageError } from './errors'
import { requireStudent } from './require-student'
import { nextStudent } from './selectors'

/**
 * Nouvel étudiant actif : si la projection montrait un autre étudiant, elle repasse en attente dans
 * la même écriture (D73). Attente ou nouvel actif déjà projeté : projection inchangée.
 */
export function withActiveStudent(session: Session, studentId: string): Session {
  const { projection } = session
  const stale = projection.mode === 'student' && projection.studentId !== studentId

  return {
    ...session,
    activeStudentId: studentId,
    projection: stale ? { mode: 'waiting' } : projection,
  }
}

/**
 * Change l'étudiant ouvert dans la vue examinateur (§7). Déjà actif : session renvoyée telle quelle
 * (pas d'écriture inutile).
 */
export function setActiveStudent(session: Session, studentId: string): Session {
  requireStudent(session, studentId)
  if (session.activeStudentId === studentId) return session

  return withActiveStudent(session, studentId)
}

/** Passe à l'étudiant suivant (§7) ; refuse s'il n'y en a aucun autre à faire passer. */
export function goToNextStudent(session: Session, currentId: string | undefined): Session {
  const next = nextStudent(session, currentId)
  if (next === null) throw new PassageError('no_next_student')

  return withActiveStudent(session, next)
}
