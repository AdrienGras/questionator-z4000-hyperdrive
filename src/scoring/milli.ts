/** Note en millièmes entiers (D01) : seule unité des calculs de note. */
export type Milli = number & { readonly __brand: 'Milli' }

/**
 * Plus grande valeur de notation acceptée en config, en valeur absolue (D44). Avec cette borne,
 * le pire produit du moteur (plafonnée × échelle, 10⁷ × 10⁷ millièmes) reste sous 2⁵³.
 */
export const MAX_SCORING_VALUE = 10_000

/** Garde D21 : tout calcul de note reste dans les entiers sûrs, sinon la donnée est corrompue. */
export function assertSafeInteger(value: number): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Calcul de note hors des entiers sûrs : ${value}`)
  }
  return value
}

export function isMilli(value: number): value is Milli {
  return Number.isSafeInteger(value)
}

export function asMilli(value: number): Milli {
  if (!isMilli(value)) throw new RangeError(`Calcul de note hors des entiers sûrs : ${value}`)
  return value
}

/** Conversion sans garde, réservée aux règles de validation : une config absurde y produit des issues, pas une exception. */
export function roundToMilli(value: number): number {
  return Math.round(value * 1000)
}

/** Seule conversion décimal → millièmes du moteur. */
export function toMilli(value: number): Milli {
  return asMilli(roundToMilli(value))
}

/** Seule conversion millièmes → décimal : affichage et export. */
export function fromMilli(value: Milli): number {
  return value / 1000
}

/** Un entier a toujours au plus 3 décimales ; au-delà de 2^53 / 1000, le calcul en millièmes déraille. */
export function hasAtMostThreeDecimals(value: number): boolean {
  return Number.isInteger(value) || roundToMilli(value) / 1000 === value
}
