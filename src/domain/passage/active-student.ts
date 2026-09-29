import type { Session } from '@/domain/session/types'
import { requireStudent } from './require-student'

/** Change l'étudiant ouvert dans la vue examinateur (§7). */
export function setActiveStudent(session: Session, studentId: string): Session {
  requireStudent(session, studentId)

  return { ...session, activeStudentId: studentId }
}
