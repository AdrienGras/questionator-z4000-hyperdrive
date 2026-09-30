import type { NormalizedConfig } from '@/domain/config/normalize'
import { exportedFinal } from '@/domain/scoring/export-value'
import { fromMilli } from '@/domain/scoring/milli'
import { computeScores } from '@/domain/scoring/score'
import { studentStatus, type StudentStatus } from '@/domain/scoring/status'
import type { Session, Student } from '@/domain/session/types'
import type { Locale } from '@/lib/i18n/i18n'
import { header, num, optionalText, text } from './cells'
import { scoreFormat, valueFormat } from './formats'
import { exportText, type ExportMessageKey } from './messages'
import type { Cell, SheetSpec } from './types'

/** Colonnes de la Synthèse, dans l'ordre de la spec, avec leur largeur. */
const COLUMNS: { key: ExportMessageKey; width: number }[] = [
  { key: 'col_examiner', width: 24 },
  { key: 'col_last_name', width: 24 },
  { key: 'col_first_name', width: 24 },
  { key: 'col_order', width: 10 },
  { key: 'col_status', width: 14 },
  { key: 'col_added_during_session', width: 14 },
  { key: 'col_raw', width: 12 },
  { key: 'col_capped', width: 12 },
  { key: 'col_converted', width: 12 },
  { key: 'col_adjustment', width: 12 },
  { key: 'col_adjustment_reason', width: 32 },
  { key: 'col_final', width: 12 },
  { key: 'col_comment', width: 40 },
]

const STATUS_KEYS: Record<StudentStatus, ExportMessageKey> = {
  done: 'status_done',
  in_progress: 'status_in_progress',
  todo: 'status_todo',
  absent: 'status_absent',
}

/** Finale exportée : libellé d'absent en texte, nombre au format du pas, vide si non terminé. */
function finalCell(student: Student, config: NormalizedConfig): Cell {
  const value = exportedFinal(student, config)
  if (value === null) return null
  return typeof value === 'string' ? text(value) : num(value, valueFormat(config, value))
}

function studentRow(session: Session, student: Student, locale: Locale): Cell[] {
  const { config } = session
  const format = scoreFormat(config)
  const scores = computeScores(student, config)
  // Absent : ni convertie ni ajustement (spec « Onglets ») ; sinon ajustement seulement s'il existe.
  const adjustment = student.absent ? undefined : student.adjustment
  return [
    optionalText(session.examiner),
    text(student.lastName),
    text(student.firstName),
    num(student.order),
    text(exportText(locale, STATUS_KEYS[studentStatus(student, config)], {})),
    text(exportText(locale, student.addedDuringSession ? 'yes' : 'no', {})),
    // Absent : brute et plafonnée vides aussi, seule la finale porte la valeur d'absent.
    student.absent ? null : num(fromMilli(scores.raw)),
    student.absent ? null : num(fromMilli(scores.capped)),
    scores.converted === null ? null : num(fromMilli(scores.converted), format),
    adjustment === undefined ? null : num(fromMilli(scores.adjustment), format),
    optionalText(adjustment?.reason),
    finalCell(student, config),
    optionalText(student.comment),
  ]
}

/** Onglet « Synthèse » : une ligne par étudiant, triée par `order`, en-têtes figés. */
export function summarySheet(session: Session, locale: Locale): SheetSpec {
  const students = session.students.toSorted((a, b) => a.order - b.order)
  return {
    name: exportText(locale, 'sheet_summary', {}),
    columns: COLUMNS.map(({ width }) => ({ width })),
    rows: [
      header(COLUMNS.map(({ key }) => exportText(locale, key, {}))),
      ...students.map((student) => studentRow(session, student, locale)),
    ],
    stickyRows: 1,
  }
}
