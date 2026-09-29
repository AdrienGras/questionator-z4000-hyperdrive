import type { ScoreBreakdown } from '@/domain/scoring/score'
import type { Milli } from '@/domain/scoring/milli'
import type { StudentStatus } from '@/domain/scoring/status'
import type { Student } from '@/domain/session/types'

/** Étudiant accompagné de son statut et de ses notes : entrée partagée des blocs de statistiques. */
export type StudentScore = { student: Student; status: StudentStatus; scores: ScoreBreakdown }

/** Effectifs par statut ; `addedDuringSession` compte les ajouts tous statuts confondus. */
export type Headcount = {
  total: number
  done: number
  inProgress: number
  todo: number
  absent: number
  addedDuringSession: number
}

/** Agrégats des notes finales des étudiants terminés. */
export type GradeStats = {
  count: number
  min: Milli | null
  max: Milli | null
  mean: number | null
  median: number | null
  stdDev: number | null
}

/** Barre d'histogramme (décimal) ; la dernière est fermée à droite. */
export type HistogramBin = { from: number; to: number; count: number }

export type CategoryStats = {
  categoryId: string
  choices: number
  scored: number
  successRate: number | null
}

export type TagStats = { tag: string; scored: number; successRate: number | null }

export type DrawnQuestion = { categoryId: string; questionId: string; count: number }

export type SkippedQuestion = {
  categoryId: string
  questionId: string
  total: number
  reasons: { reason: string | null; count: number }[]
}

export type Strategy = {
  composition: { categoryId: string; count: number }[]
  students: number
  meanFinal: number
}

export type AdjustmentStats = { count: number; sum: Milli; mean: number | null }

/** Statistiques d'une session : identifiants, nombres et `null`, aucun texte. */
export type SessionStats = {
  headcount: Headcount
  grades: GradeStats
  histogram: HistogramBin[]
  categories: CategoryStats[]
  tags: TagStats[]
  topDrawn: DrawnQuestion[]
  skipped: SkippedQuestion[]
  strategies: Strategy[]
  adjustments: AdjustmentStats
}
