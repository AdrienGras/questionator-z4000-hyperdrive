import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Student } from '@/domain/session/types'
import { computeScores } from './score'
import { asMilli, hasAtMostThreeDecimals, toMilli, type Milli } from './milli'
import { stepMilli } from './rounding'

/**
 * Un ajustement se saisit par multiples du pas d'arrondi (D02), au plus `finalScale` en valeur
 * absolue (D44). Ne lève jamais : les contrôles bornent la valeur avant toute conversion.
 */
export function isValidAdjustment(value: number, config: NormalizedConfig): boolean {
  if (!Number.isFinite(value) || !hasAtMostThreeDecimals(value)) return false
  if (Math.abs(value) > config.scoring.finalScale) return false
  return toMilli(value) % stepMilli(config) === 0
}

const NUMBER_SHAPE = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/

/** Saisie d'un ajustement : virgule ou point, signe « − » typographique, espaces tolérés. */
export function parseAdjustmentInput(text: string): number | null {
  const cleaned = text.replaceAll('\u2212', '-').replaceAll(/[\s\u00A0\u202F]/g, '')
  if (!NUMBER_SHAPE.test(cleaned)) return null
  const value = Number(cleaned.replace(',', '.'))
  if (!Number.isFinite(value) || !hasAtMostThreeDecimals(value)) return null
  return value
}

export type FinalPreview = { converted: Milli; adjustment: Milli; final: Milli; clamped: boolean }

/** Aperçu de la note finale avec `value` comme ajustement (l'ajustement enregistré est ignoré). */
export function previewFinal(
  student: Student,
  config: NormalizedConfig,
  value: number,
): FinalPreview {
  const { converted, adjustment, final } = computeScores(
    { ...student, adjustment: { value } },
    config,
  )
  if (converted === null || final === null) {
    throw new Error(`Aperçu impossible : l'étudiant « ${student.id} » n'a pas terminé son passage`)
  }
  const sum = converted + adjustment
  const clamped = sum < 0 || sum > toMilli(config.scoring.finalScale)
  return { converted, adjustment, final: asMilli(final), clamped }
}
