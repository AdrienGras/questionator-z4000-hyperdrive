import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Locale } from '@/lib/i18n/i18n'
import { fromMilli, type Milli } from './milli'
import { stepMilli } from './rounding'

/** `final` : convertie, finale, ajustement ; `raw` : brute et plafonnée (D42). */
export type ScoreKind = 'raw' | 'final'

/** Décimales du pas : 500 → 1, 250 → 2, 1 → 3, 1 000 ou 2 000 → 0. */
export function stepDecimals(step: Milli): number {
  let decimals = 3
  let remaining: number = step
  while (decimals > 0 && remaining % 10 === 0) {
    remaining /= 10
    decimals -= 1
  }
  return decimals
}

/** Note brute, ou maximum d'un barème : jusqu'à 3 décimales, sans zéro final (« 2,5 », « 1 »). */
export function formatRawScore(value: Milli, locale: Locale): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(fromMilli(value))
}

export function formatScore(
  value: Milli,
  kind: ScoreKind,
  config: NormalizedConfig,
  locale: Locale,
): string {
  if (kind === 'raw') return formatRawScore(value, locale)
  const decimals = stepDecimals(stepMilli(config))
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fromMilli(value))
}
