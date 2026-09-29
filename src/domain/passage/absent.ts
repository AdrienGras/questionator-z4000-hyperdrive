import type { Session } from '@/domain/session/types'
import { requireStudent } from './require-student'
import { resetStudent } from './reset'

/**
 * Déclare un étudiant absent ou de nouveau présent (F12). Absent : le passage est remis à zéro
 * (`resetStudent`) ; présent : l'étudiant, sans attempt, redevient « à passer ». Le commentaire est
 * conservé dans les deux sens. Même valeur : session renvoyée telle quelle.
 */
export function setAbsent(
  session: Session,
  input: { studentId: string; absent: boolean },
): Session {
  const student = requireStudent(session, input.studentId)
  if (input.absent === student.absent) return session

  const base = input.absent ? resetStudent(session, student.id) : session
  return {
    ...base,
    students: base.students.map((s) => (s.id === student.id ? { ...s, absent: input.absent } : s)),
  }
}
