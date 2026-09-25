import type { NormalizedConfig } from '../config/normalize'

/**
 * Modèle de données du §7, posé par F03 et persisté par F04 (D21). Identifiants en chaînes,
 * dates en ISO 8601 ; `score` et `adjustment.value` restent des décimaux, convertis en
 * millièmes à l'entrée du moteur seulement (D43).
 */
export type AttemptOutcome = 'pending' | 'scored' | 'skipped'

export type Attempt = {
  id: string
  categoryId: string
  questionId: string
  drawnAt: string
  outcome: AttemptOutcome
  /** Valeur du barème si `outcome` vaut `scored`. */
  score?: number
  /** Motif si `outcome` vaut `skipped`. */
  skipReason?: string
  editedAt?: string
}

export type Student = {
  id: string
  lastName: string
  firstName: string
  order: number
  addedDuringSession: boolean
  absent: boolean
  /** Questions tirées, dans l'ordre. */
  attempts: Attempt[]
  adjustment?: { value: number; reason?: string }
  comment?: string
  /** Note finale affichée sur la vue projetée (F14, D31). */
  finalRevealedAt?: string
}

export type Session = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  examiner?: string
  appVersion: string
  /** Snapshot figé et validé (F02). */
  config: NormalizedConfig
  students: Student[]
  /** Étudiant ouvert dans la vue examinateur. */
  activeStudentId?: string
  projection: { mode: 'waiting' | 'student'; studentId?: string }
}
