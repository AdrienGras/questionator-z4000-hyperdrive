import type { Session } from './types'

/** Examinateur vide → clé retirée (D11), jamais de chaîne vide stockée. */
export function withExaminer(session: Session, examiner: string): Session {
  const next = { ...session }
  delete next.examiner
  return examiner === '' ? next : { ...next, examiner }
}
