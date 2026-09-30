import type { NormalizedConfig } from '@/domain/config/normalize'
import { stepDecimals } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import { stepMilli } from '@/domain/scoring/rounding'
import type { Locale } from '@/lib/i18n/i18n'

/** Format des taux de réussite. */
export const RATE_FORMAT = '0.0%'

/** Format des moyennes, médianes et écarts-types. */
export const DECIMAL_2_FORMAT = '0.00'

function decimalFormat(decimals: number): string {
  return decimals === 0 ? '0' : `0.${'0'.repeat(decimals)}`
}

/** Format des notes au pas d'arrondi : `0`, `0.0`, `0.00` ou `0.000` (D42, D71). */
export function scoreFormat(config: NormalizedConfig): string {
  return decimalFormat(stepDecimals(stepMilli(config)))
}

/** Format d'une valeur libre (absent) : le plus fin entre les décimales du pas et celles de la valeur (≤ 3). */
export function valueFormat(config: NormalizedConfig, value: number): string {
  const own = stepDecimals(toMilli(value))
  return decimalFormat(Math.max(stepDecimals(stepMilli(config)), own))
}

/** Format des dates selon la langue de l'export. */
export function dateFormat(locale: Locale): string {
  return locale === 'fr' ? 'dd/mm/yyyy hh:mm' : 'yyyy-mm-dd hh:mm'
}
