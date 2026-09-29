import { studentStatus } from '@/domain/scoring/status'
import type { Session } from '@/domain/session/types'
import { PassageError } from './errors'
import { requireStudent } from './require-student'

export type RevealDeps = { now: () => Date }

/**
 * Marque la note finale comme révélée (F11). Idempotent : la première date fait foi.
 */
export function revealFinal(
  session: Session,
  input: { studentId: string },
  deps: RevealDeps,
): Session {
  const student = requireStudent(session, input.studentId)
  if (studentStatus(student, session.config) !== 'done') throw new PassageError('student_not_done')
  if (student.finalRevealedAt !== undefined) return session

  const finalRevealedAt = deps.now().toISOString()
  return {
    ...session,
    students: session.students.map((s) => (s.id === student.id ? { ...s, finalRevealedAt } : s)),
  }
}
