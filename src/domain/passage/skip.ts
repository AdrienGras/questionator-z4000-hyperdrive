import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Session, Student } from '@/domain/session/types'
import { PassageError } from './errors'
import { normalizeReason } from './reason'
import { requireStudent } from './require-student'

/** Passes restantes pour cet étudiant ; 0 si les skips sont désactivés. */
export function skipsRemaining(student: Student, config: NormalizedConfig): number {
  if (!config.skips.enabled) return 0
  const used = student.attempts.filter((attempt) => attempt.outcome === 'skipped').length
  return Math.max(config.skips.maxPerStudent - used, 0)
}

/**
 * Abandonne un attempt `pending` sans pénalité (F10). Le motif est trimé puis tronqué à
 * `MAX_REASON_LENGTH` ; vide, il n'est pas enregistré. Hors `skips.reasons`, il n'est
 * accepté que si `skips.allowFreeText` (D65).
 */
export function skipAttempt(
  session: Session,
  input: { studentId: string; attemptId: string; reason?: string },
): Session {
  const student = requireStudent(session, input.studentId)

  const attempt = student.attempts.find((a) => a.id === input.attemptId)
  if (attempt === undefined) throw new PassageError('attempt_not_found')
  if (attempt.outcome !== 'pending') throw new PassageError('not_pending')

  const { skips } = session.config
  if (!skips.enabled) throw new PassageError('skips_disabled')
  if (skipsRemaining(student, session.config) === 0) throw new PassageError('skip_quota_reached')

  const reason = normalizeReason(input.reason)
  if (reason !== undefined && !skips.allowFreeText && !skips.reasons.includes(reason)) {
    throw new PassageError('reason_not_allowed')
  }

  const skipped = {
    ...attempt,
    outcome: 'skipped' as const,
    ...(reason === undefined ? {} : { skipReason: reason }),
  }

  return {
    ...session,
    students: session.students.map((s) =>
      s.id === student.id
        ? { ...s, attempts: s.attempts.map((a) => (a.id === attempt.id ? skipped : a)) }
        : s,
    ),
  }
}
