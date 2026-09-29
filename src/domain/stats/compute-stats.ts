import { computeScores } from '@/domain/scoring/score'
import { studentStatus } from '@/domain/scoring/status'
import type { Session } from '@/domain/session/types'
import { computeAdjustments } from './adjustments'
import { computeCategories } from './categories'
import { computeGrades, computeHistogram } from './grades'
import { computeHeadcount } from './headcount'
import { computeTopDrawn, computeSkipped } from './questions'
import { computeStrategies } from './strategies'
import { computeTags } from './tags'
import type { SessionStats, StudentScore } from './types'

/** Point d'entrée : notes et statut calculés une fois par étudiant, puis chaque bloc de stats. */
export function computeStats(session: Session): SessionStats {
  const { config } = session
  const scored: StudentScore[] = session.students.map((student) => ({
    student,
    status: studentStatus(student, config),
    scores: computeScores(student, config),
  }))
  return {
    headcount: computeHeadcount(scored),
    grades: computeGrades(scored),
    histogram: computeHistogram(scored, config),
    categories: computeCategories(session),
    tags: computeTags(session),
    topDrawn: computeTopDrawn(session),
    skipped: computeSkipped(session),
    strategies: computeStrategies(scored, config),
    adjustments: computeAdjustments(session.students),
  }
}
