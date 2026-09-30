import type { Session } from '@/domain/session/types'
import type { Locale } from '@/lib/i18n/i18n'
import { date, header, optionalText, text } from './cells'
import { dateFormat } from './formats'
import { exportText, type ExportMessageKey } from './messages'
import type { Cell, SheetSpec } from './types'

/** Onglet « Métadonnées » : paires réglage → valeur ; `now` est la date d'export. */
export function metadataSheet(session: Session, locale: Locale, now: Date): SheetSpec {
  const label = (key: ExportMessageKey): string => exportText(locale, key, {})
  const format = dateFormat(locale)
  const pair = (key: ExportMessageKey, value: Cell): Cell[] => [text(label(key)), value]
  const { exam } = session.config
  return {
    name: label('sheet_metadata'),
    columns: [{ width: 32 }, { width: 40 }],
    rows: [
      header([label('col_setting'), label('col_value')]),
      pair('meta_session_name', text(session.name)),
      pair('meta_examiner', optionalText(session.examiner)),
      pair('meta_exam_title', optionalText(exam.title)),
      pair('meta_subject', optionalText(exam.subject)),
      pair('meta_cohort', optionalText(exam.cohort)),
      pair('meta_created_at', date(new Date(session.createdAt), format)),
      pair('meta_exported_at', date(now, format)),
      pair('meta_app_version', text(session.appVersion)),
    ],
  }
}
