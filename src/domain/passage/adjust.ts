import { isValidAdjustment } from '@/domain/scoring/adjustment'
import { studentStatus } from '@/domain/scoring/status'
import type { Session } from '@/domain/session/types'
import { PassageError } from './errors'
import { normalizeReason } from './reason'
import { requireStudent } from './require-student'

/**
 * Pose l'ajustement d'un étudiant dont le passage est terminé (F11). La valeur doit être un
 * multiple du pas d'arrondi ; 0 supprime l'ajustement et sa justification (D29).
 */
export function setAdjustment(
  session: Session,
  input: { studentId: string; value: number; reason?: string },
): Session {
  const student = requireStudent(session, input.studentId)
  if (studentStatus(student, session.config) !== 'done') throw new PassageError('student_not_done')
  if (!isValidAdjustment(input.value, session.config)) throw new PassageError('adjustment_invalid')

  const { adjustment: _previous, ...rest } = student
  const reason = normalizeReason(input.reason)
  const updated =
    input.value === 0
      ? rest
      : { ...rest, adjustment: { value: input.value, ...(reason === undefined ? {} : { reason }) } }

  return {
    ...session,
    students: session.students.map((s) => (s.id === student.id ? updated : s)),
  }
}
