import type { NormalizedCategory, NormalizedQuestion } from '@/domain/config/normalize'
import type { Attempt, AttemptOutcome, Session } from '@/domain/session/types'
import type { Locale } from '@/lib/i18n/i18n'
import { date, header, num, optionalText, text } from './cells'
import { dateFormat } from './formats'
import { exportText, type ExportMessageKey } from './messages'
import type { Cell, SheetSpec } from './types'

/** Colonnes du Détail, dans l'ordre de la spec, avec leur largeur. */
const COLUMNS: { key: ExportMessageKey; width: number }[] = [
  { key: 'col_examiner', width: 24 },
  { key: 'col_student', width: 28 },
  { key: 'col_rank', width: 8 },
  { key: 'col_category', width: 24 },
  { key: 'col_question_id', width: 16 },
  { key: 'col_question_title', width: 40 },
  { key: 'col_tags', width: 24 },
  { key: 'col_result', width: 12 },
  { key: 'col_points', width: 10 },
  { key: 'col_max_points', width: 12 },
  { key: 'col_skip_reason', width: 32 },
  { key: 'col_drawn_at', width: 18 },
  { key: 'col_edited_at', width: 18 },
]

const RESULT_KEYS: Record<AttemptOutcome, ExportMessageKey> = {
  scored: 'result_scored',
  skipped: 'result_skipped',
  pending: 'result_pending',
}

type AttemptContext = {
  session: Session
  locale: Locale
  studentName: string
  rank: number
}

/** Ligne d'un attempt ; catégorie ou question inconnue → id écrit, libellé et titre vides. */
function attemptRow(
  attempt: Attempt,
  { session, locale, studentName, rank }: AttemptContext,
): Cell[] {
  const format = dateFormat(locale)
  const category: NormalizedCategory | undefined = session.config.categories.find(
    ({ id }) => id === attempt.categoryId,
  )
  const question: NormalizedQuestion | undefined = category?.questions.find(
    ({ id }) => id === attempt.questionId,
  )
  return [
    optionalText(session.examiner),
    text(studentName),
    num(rank),
    text(category?.label ?? attempt.categoryId),
    text(attempt.questionId),
    optionalText(question?.title),
    optionalText(question?.tags.join(', ')),
    text(exportText(locale, RESULT_KEYS[attempt.outcome], {})),
    attempt.outcome === 'scored' && attempt.score !== undefined ? num(attempt.score) : null,
    category === undefined || category.scale.length === 0 ? null : num(Math.max(...category.scale)),
    attempt.outcome === 'skipped' ? optionalText(attempt.skipReason) : null,
    date(new Date(attempt.drawnAt), format),
    attempt.editedAt === undefined ? null : date(new Date(attempt.editedAt), format),
  ]
}

/** Onglet « Détail des questions » : une ligne par attempt, triée par `order` puis rang. */
export function detailSheet(session: Session, locale: Locale): SheetSpec {
  const students = session.students.toSorted((a, b) => a.order - b.order)
  return {
    name: exportText(locale, 'sheet_detail', {}),
    columns: COLUMNS.map(({ width }) => ({ width })),
    rows: [
      header(COLUMNS.map(({ key }) => exportText(locale, key, {}))),
      ...students.flatMap((student) =>
        student.attempts.map((attempt, index) =>
          attemptRow(attempt, {
            session,
            locale,
            studentName: `${student.lastName} ${student.firstName}`,
            rank: index + 1,
          }),
        ),
      ),
    ],
    stickyRows: 1,
  }
}
