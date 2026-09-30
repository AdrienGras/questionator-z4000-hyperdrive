import type { NormalizedConfig } from '@/domain/config/normalize'
import { stepDecimals } from '@/domain/scoring/format'
import { stepMilli } from '@/domain/scoring/rounding'
import type { Locale } from '@/lib/i18n/i18n'

/** Format des taux de réussite. */
export const RATE_FORMAT = '0.0%'

/** Format des moyennes, médianes et écarts-types. */
export const DECIMAL_2_FORMAT = '0.00'

/** Format des notes au pas d'arrondi : `0`, `0.0`, `0.00` ou `0.000` (D42, D71). */
export function scoreFormat(config: NormalizedConfig): string {
  const decimals = stepDecimals(stepMilli(config))
  return decimals === 0 ? '0' : `0.${'0'.repeat(decimals)}`
}

/** Format des dates selon la langue de l'export. */
export function dateFormat(locale: Locale): string {
  return locale === 'fr' ? 'dd/mm/yyyy hh:mm' : 'yyyy-mm-dd hh:mm'
}
