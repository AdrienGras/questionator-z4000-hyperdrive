import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Student } from '@/domain/session/types'

export type StudentStatus = 'absent' | 'done' | 'in_progress' | 'todo'

/** Statut dérivé (§7) : skips et attempts `pending` ne comptent pas vers `questionsPerStudent`. */
export function studentStatus(student: Student, config: NormalizedConfig): StudentStatus {
  if (student.absent) return 'absent'
  const scored = student.attempts.filter((attempt) => attempt.outcome === 'scored').length
  if (scored >= config.scoring.questionsPerStudent) return 'done'
  return student.attempts.length > 0 ? 'in_progress' : 'todo'
}
