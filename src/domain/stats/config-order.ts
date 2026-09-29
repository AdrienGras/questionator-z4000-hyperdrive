import type { NormalizedConfig } from '@/domain/config/normalize'
import { toMilli, type Milli } from '@/domain/scoring/milli'
import type { Attempt, Session } from '@/domain/session/types'

/** Rang d'un id absent de la config : trié après toutes les questions connues. */
export const UNKNOWN_RANK = Number.MAX_SAFE_INTEGER

/** Clé stable d'une question ; le séparateur ne peut pas apparaître dans un id de config. */
export const questionKey = (categoryId: string, questionId: string): string =>
  `${categoryId}\u0000${questionId}`

/** Rang de chaque `(categoryId, questionId)` dans la config (catégories par `order`, puis questions). */
export function questionRanks(config: NormalizedConfig): Map<string, number> {
  const ranks = new Map<string, number>()
  for (const category of config.categories) {
    for (const question of category.questions) {
      const key = questionKey(category.id, question.id)
      if (!ranks.has(key)) ranks.set(key, ranks.size)
    }
  }
  return ranks
}

/** Attempts des seuls étudiants présents : un absent avec attempts résiduels est ignoré. */
export function presentAttempts(session: Session): Attempt[] {
  return session.students.filter((student) => !student.absent).flatMap((s) => s.attempts)
}

/** Points d'un attempt `scored` en millièmes ; lève sur un score manquant, comme `computeScores`. */
export function attemptPoints(attempt: Attempt): Milli {
  if (attempt.score === undefined) {
    throw new Error(`Attempt « ${attempt.id} » noté sans score : donnée corrompue`)
  }
  return toMilli(attempt.score)
}

/** Cumul de points obtenus et de points possibles (millièmes), pour un taux de réussite. */
export type Tally = { scored: number; points: number; max: number }

export const emptyTally = (): Tally => ({ scored: 0, points: 0, max: 0 })

/** Ajoute un attempt noté au cumul ; `scale` est le barème de sa catégorie. */
export function addToTally(tally: Tally, attempt: Attempt, scale: number[]): void {
  tally.scored++
  tally.points += attemptPoints(attempt)
  tally.max += toMilli(Math.max(...scale))
}

/** Taux de réussite 0–1, `null` sans note ou si le total possible vaut 0. */
export function successRate(tally: Tally): number | null {
  return tally.scored === 0 || tally.max === 0 ? null : tally.points / tally.max
}
