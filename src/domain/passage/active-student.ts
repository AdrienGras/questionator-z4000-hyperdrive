import type { Session } from '@/domain/session/types'
import { PassageError } from './errors'

/** Change l'étudiant ouvert dans la vue examinateur (§7). */
export function setActiveStudent(session: Session, studentId: string): Session {
  const student = session.students.find((s) => s.id === studentId)
  if (student === undefined) throw new PassageError('student_not_found')

  return { ...session, activeStudentId: studentId }
}
