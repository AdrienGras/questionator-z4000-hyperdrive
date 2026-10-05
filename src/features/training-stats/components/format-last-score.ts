import { NO_VALUE } from '@/components/stats/format-rate'
import { formatRawScore } from '@/domain/scoring/format'
import { asMilli } from '@/domain/scoring/milli'
import type { QuestionStats } from '@/domain/training/training-stats'
import type { Locale } from '@/lib/i18n/i18n'

/** Dernière note figée « points / max » (millièmes, format décimal de la langue), « — » sans note. */
export function formatLastScore(last: QuestionStats['last'], locale: Locale): string {
  if (last === null) return NO_VALUE
  return `${formatRawScore(asMilli(last.points), locale)} / ${formatRawScore(asMilli(last.max), locale)}`
}
