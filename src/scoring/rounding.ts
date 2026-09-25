import type { NormalizedConfig } from '../config/normalize'
import type { Fraction } from './fraction'
import { asMilli, assertSafeInteger, toMilli, type Milli } from './milli'

export type RoundingMode = NormalizedConfig['scoring']['rounding']['mode']

/** Pas d'arrondi en millièmes : `rounding.step` s'il est défini, sinon 10^-decimals (§5). */
export function stepMilli(config: NormalizedConfig): Milli {
  const { step, decimals } = config.scoring.rounding
  return toMilli(step ?? 10 ** -decimals)
}

function roundsUp(remainder: number, divisor: number, mode: RoundingMode): boolean {
  if (mode === 'down') {
    return false
  }
  if (mode === 'up') {
    return remainder > 0
  }
  // Égalité vers le haut (D19).
  return 2 * remainder >= divisor
}

/**
 * Arrondit `value` (millièmes, fraction exacte) au multiple de `step` selon `mode`, en
 * arithmétique entière. La grille est ancrée en 0 ; les valeurs négatives sont gérées.
 */
export function roundToStep(value: Fraction, step: Milli, mode: RoundingMode): Milli {
  if (step <= 0) throw new RangeError(`Pas d'arrondi non positif : ${step}`)
  const divisor = assertSafeInteger(value.den * step)
  // Le quotient flottant n'est qu'une estimation : on le corrige par le reste entier.
  let quotient = Math.floor(value.num / divisor)
  let remainder = value.num - quotient * divisor
  while (remainder < 0) {
    quotient -= 1
    remainder += divisor
  }
  while (remainder >= divisor) {
    quotient += 1
    remainder -= divisor
  }
  const rounded = roundsUp(remainder, divisor, mode) ? quotient + 1 : quotient
  return asMilli(rounded * step)
}
