import type { Session } from '@/domain/types'
import { studentStatus } from '@/scoring'

/** Passés = done, absents = absent, restants = todo + in_progress (D52). */
export function sessionProgress(session: Session): {
  done: number
  absent: number
  remaining: number
  total: number
} {
  let done = 0
  let absent = 0
  for (const student of session.students) {
    const status = studentStatus(student, session.config)
    if (status === 'done') done += 1
    if (status === 'absent') absent += 1
  }
  const total = session.students.length
  return { done, absent, remaining: total - done - absent, total }
}
