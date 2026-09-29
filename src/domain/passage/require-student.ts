import type { Session, Student } from '@/domain/session/types'
import { PassageError } from './errors'

/** L'étudiant `studentId` de la session ; `student_not_found` s'il n'y est pas. */
export function requireStudent(session: Session, studentId: string): Student {
  const student = session.students.find((s) => s.id === studentId)
  if (student === undefined) throw new PassageError('student_not_found')
  return student
}
