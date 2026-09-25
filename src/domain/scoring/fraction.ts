import { assertSafeInteger } from './milli'

/** Valeur exacte en millièmes, égale à `num / den` (D01) ; `den > 0`, entiers sûrs. */
export type Fraction = { readonly num: number; readonly den: number }

export function fraction(num: number, den: number): Fraction {
  assertSafeInteger(num)
  assertSafeInteger(den)
  if (den <= 0) throw new RangeError(`Dénominateur non positif : ${den}`)
  return { num, den }
}
