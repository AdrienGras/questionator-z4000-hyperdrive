import type { NormalizedConfig } from '@/domain/config/normalize'
import { stepDecimals } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import { stepMilli } from '@/domain/scoring/rounding'
import type { Locale } from '@/lib/i18n/i18n'

/**
 * Valeur du champ d'ajustement, signée et aux décimales des notes finales (artboard
 * `session-dialogues`) : « +0,50 », « −0,25 », « 0,00 ». Sans séparateur de milliers : le champ
 * est relu par `parseAdjustmentInput`, qui prendrait « 1,000 » pour 1.
 */
export function formatAdjustmentInput(
  value: number,
  config: NormalizedConfig,
  locale: Locale,
): string {
  const decimals = stepDecimals(stepMilli(config))
  const magnitude = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false,
  }).format(Math.abs(value))
  const milli = toMilli(value)
  if (milli === 0) return magnitude
  return `${milli > 0 ? '+' : '−'}${magnitude}`
}
