import { buildWorkbook } from '@/domain/export/build-workbook'
import { workbookFileName } from '@/domain/export/file-name'
import type { Session } from '@/domain/session/types'
import { computeStats } from '@/domain/stats/compute-stats'
import type { Locale } from '@/lib/i18n/i18n'

/**
 * Génère le classeur de la session et le télécharge. La bibliothèque d'écriture xlsx n'est
 * chargée qu'ici, à la demande : hors du bundle initial. Rejette si le chunk ou l'écriture échoue.
 */
export async function exportWorkbook(session: Session, locale: Locale): Promise<void> {
  const now = new Date()
  const spec = buildWorkbook(session, computeStats(session), locale, now)
  const { writeWorkbook } = await import('@/lib/xlsx/write-workbook')
  await writeWorkbook(spec, workbookFileName(session, now))
}
