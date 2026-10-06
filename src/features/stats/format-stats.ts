import { NO_VALUE } from '@/components/stats/format-rate'
import type { Locale } from '@/lib/i18n/i18n'

/** Moyenne, médiane, écart-type : 2 décimales fixes ; `null` → « — ». */
export function formatDecimal(value: number | null, locale: Locale): string {
  if (value === null) return NO_VALUE
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
