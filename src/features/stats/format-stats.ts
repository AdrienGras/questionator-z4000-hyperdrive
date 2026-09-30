import type { HistogramBin } from '@/domain/stats/types'
import type { Locale } from '@/lib/i18n/i18n'

/** Valeur absente (aucun terminé, aucun attempt noté). */
export const NO_VALUE = '—'

/** Moyenne, médiane, écart-type : 2 décimales fixes ; `null` → « — ». */
export function formatDecimal(value: number | null, locale: Locale): string {
  if (value === null) return NO_VALUE
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Taux de réussite en pourcentage, 0 à 1 décimale ; un taux négatif s'affiche tel quel. */
export function formatRate(value: number | null, locale: Locale): string {
  if (value === null) return NO_VALUE
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value)
}

/** Nombre d'une borne de barre : jusqu'à 3 décimales (les bornes sont des fractions de l'échelle). */
const formatBound = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value)

/** Libellé complet d'une barre, « [0 ; 1[ » ; la dernière est fermée : « [2 ; 2,5] ». */
export function binLabel(bin: HistogramBin, isLast: boolean, locale: Locale): string {
  return `[${formatBound(bin.from, locale)} ; ${formatBound(bin.to, locale)}${isLast ? ']' : '['}`
}

/** Libellé court pour l'axe du graphique, « 0–1 ». */
export function binTick(bin: HistogramBin, locale: Locale): string {
  return `${formatBound(bin.from, locale)}–${formatBound(bin.to, locale)}`
}
