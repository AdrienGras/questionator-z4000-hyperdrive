import type { NormalizedConfig } from '../config/normalize'
import type { Locale } from '../i18n'
import { fromMilli, type Milli } from './milli'
import { stepMilli } from './rounding'

/** `final` : convertie, finale, ajustement ; `raw` : brute et plafonnée (D42). */
export type ScoreKind = 'raw' | 'final'

/** Décimales du pas : 500 → 1, 250 → 2, 1 → 3, 1 000 ou 2 000 → 0. */
function stepDecimals(step: Milli): number {
  let decimals = 3
  let remaining: number = step
  while (decimals > 0 && remaining % 10 === 0) {
    remaining /= 10
    decimals -= 1
  }
  return decimals
}

export function formatScore(
  value: Milli,
  kind: ScoreKind,
  config: NormalizedConfig,
  locale: Locale,
): string {
  if (kind === 'raw') {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(fromMilli(value))
  }
  const decimals = stepDecimals(stepMilli(config))
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fromMilli(value))
}
