import { asMilli, toMilli } from '@/domain/scoring/milli'
import type { Student } from '@/domain/session/types'
import type { AdjustmentStats } from './types'

/** Ajustements non nuls des étudiants présents (tous statuts) : nombre, somme signée et moyenne. */
export function computeAdjustments(students: Student[]): AdjustmentStats {
  let count = 0
  let sum = 0
  for (const student of students) {
    if (student.absent) continue
    const value = toMilli(student.adjustment?.value ?? 0)
    if (value === 0) continue
    count++
    sum += value
  }
  return { count, sum: asMilli(sum), mean: count === 0 ? null : sum / count / 1000 }
}
