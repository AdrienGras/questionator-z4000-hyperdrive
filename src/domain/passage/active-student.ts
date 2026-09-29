import type { Session } from '@/domain/session/types'
import { PassageError } from './errors'
import { requireStudent } from './require-student'
import { nextStudent } from './selectors'

/** Change l'étudiant ouvert dans la vue examinateur (§7). */
export function setActiveStudent(session: Session, studentId: string): Session {
  requireStudent(session, studentId)

  return { ...session, activeStudentId: studentId }
}

/** Passe à l'étudiant suivant (§7) ; refuse s'il n'y en a aucun autre à faire passer. */
export function goToNextStudent(session: Session, currentId: string | undefined): Session {
  const next = nextStudent(session, currentId)
  if (next === null) throw new PassageError('no_next_student')

  return { ...session, activeStudentId: next }
}
