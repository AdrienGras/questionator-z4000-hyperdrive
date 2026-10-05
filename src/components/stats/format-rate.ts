import type { Locale } from '@/lib/i18n/i18n'

/** Valeur absente (aucun terminé, aucun attempt noté). */
export const NO_VALUE = '—'

/** Taux de réussite en pourcentage, 0 à 1 décimale ; un taux négatif s'affiche tel quel. */
export function formatRate(value: number | null, locale: Locale): string {
  if (value === null) return NO_VALUE
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value)
}
