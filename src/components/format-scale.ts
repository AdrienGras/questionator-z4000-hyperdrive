import { formatRawScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Locale } from '@/lib/i18n/i18n'

/**
 * Barème d'une catégorie formaté selon la langue (« 0 · 0,5 · 1 ») : ` · ` dans l'aperçu de la
 * création, ` / ` dans l'aperçu de l'éditeur.
 */
export function formatScale(
  scale: readonly number[],
  locale: Locale,
  separator: ' · ' | ' / ',
): string {
  return scale.map((point) => formatRawScore(toMilli(point), locale)).join(separator)
}
