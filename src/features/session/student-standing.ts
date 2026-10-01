import type { NormalizedConfig } from '@/domain/config/normalize'
import { computeScores, type ScoreBreakdown } from '@/domain/scoring/score'
import { studentStatus, type StudentStatus } from '@/domain/scoring/status'
import type { Student } from '@/domain/session/types'

/**
 * Statut et notes de l'étudiant actif, calculés une seule fois par `ExaminerView` et passés en
 * props à la ligne d'infos, à l'aiguillage par statut et aux listes de notes.
 */
export type StudentStanding = Readonly<{ status: StudentStatus; scores: ScoreBreakdown }>

export function studentStanding(student: Student, config: NormalizedConfig): StudentStanding {
  return { status: studentStatus(student, config), scores: computeScores(student, config) }
}
