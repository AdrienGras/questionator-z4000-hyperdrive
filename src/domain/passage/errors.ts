/** Codes de refus des transitions de passage (§7). */
export type PassageErrorCode =
  | 'student_not_found'
  | 'category_not_found'
  | 'attempt_not_found'
  | 'student_absent'
  | 'student_done'
  | 'pending_exists'
  | 'category_exhausted'
  | 'not_pending'
  | 'score_not_in_scale'

/** Erreur levée par une transition refusée ; la session d'entrée n'est jamais modifiée. */
export class PassageError extends Error {
  readonly code: PassageErrorCode

  constructor(code: PassageErrorCode) {
    super(code)
    this.name = 'PassageError'
    this.code = code
  }
}
