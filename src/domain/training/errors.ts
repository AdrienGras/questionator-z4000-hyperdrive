/** Codes de refus des transitions d'entraînement. */
export type TrainingErrorCode =
  | 'category_not_found'
  | 'pending_exists'
  | 'not_pending'
  | 'score_not_in_scale'

/** Erreur levée par une transition refusée ; le journal n'est jamais modifié. */
export class TrainingError extends Error {
  readonly code: TrainingErrorCode

  constructor(code: TrainingErrorCode) {
    super(code)
    this.name = 'TrainingError'
    this.code = code
  }
}
