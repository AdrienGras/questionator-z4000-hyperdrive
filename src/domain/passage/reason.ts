/** Longueur maximale d'un motif de skip ou d'une justification d'ajustement, après trim (D65). */
export const MAX_REASON_LENGTH = 200

/** Trim puis troncature à `MAX_REASON_LENGTH` ; `undefined` si le résultat est vide. */
export function normalizeReason(reason: string | undefined): string | undefined {
  const normalized = (reason ?? '').trim().slice(0, MAX_REASON_LENGTH)
  return normalized === '' ? undefined : normalized
}
