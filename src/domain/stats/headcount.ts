import type { Headcount, StudentScore } from './types'

/** Un compteur par statut ; `addedDuringSession` compte les ajouts quel que soit leur statut. */
export function computeHeadcount(scored: StudentScore[]): Headcount {
  const headcount: Headcount = {
    total: scored.length,
    done: 0,
    inProgress: 0,
    todo: 0,
    absent: 0,
    addedDuringSession: 0,
  }
  for (const { student, status } of scored) {
    if (status === 'done') headcount.done++
    else if (status === 'in_progress') headcount.inProgress++
    else if (status === 'todo') headcount.todo++
    else headcount.absent++
    if (student.addedDuringSession) headcount.addedDuringSession++
  }
  return headcount
}
