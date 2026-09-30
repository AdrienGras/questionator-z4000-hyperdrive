import type { Session } from '@/domain/session/types'
import type { SessionStats } from '@/domain/stats/types'
import type { Locale } from '@/lib/i18n/i18n'
import { configSheet } from './config-sheet'
import { detailSheet } from './detail-sheet'
import { metadataSheet } from './metadata-sheet'
import { statsSheet } from './stats-sheet'
import { summarySheet } from './summary-sheet'
import type { WorkbookSpec } from './types'

/** Classeur d'export : Synthèse, Détail, Statistiques, Configuration, Métadonnées ; `now` = date d'export. */
export function buildWorkbook(
  session: Session,
  stats: SessionStats,
  locale: Locale,
  now: Date,
): WorkbookSpec {
  return [
    summarySheet(session, locale),
    detailSheet(session, locale),
    statsSheet(session, stats, locale),
    configSheet(session, locale),
    metadataSheet(session, locale, now),
  ]
}
