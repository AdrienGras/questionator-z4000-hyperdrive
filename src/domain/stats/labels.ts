import type { HistogramBin, SkippedQuestion } from './types'
import type { Locale } from '@/lib/i18n/i18n'

/** Formate un élément compté, « Facile ×2 » : fourni par l'appelant (dictionnaire de l'écran ou de l'export). */
export type TimesFormatter = (label: string, count: number) => string

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

/** « Hors programme ×2, sans motif ×1 » : motifs déjà triés par le domaine, `noReason` pour `null`. */
export function reasonsLabel(
  reasons: SkippedQuestion['reasons'],
  noReason: string,
  times: TimesFormatter,
): string {
  return reasons.map(({ reason, count }) => times(reason ?? noReason, count)).join(', ')
}

/** « Facile ×2 · Difficile ×1 » : parts déjà libellées, dans l'ordre reçu. */
export function compositionLabel(
  parts: { label: string; count: number }[],
  times: TimesFormatter,
): string {
  return parts.map(({ label, count }) => times(label, count)).join(' · ')
}
