import type { ScoreBreakdown } from '@/domain/scoring/score'
import type { Session, Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { AttemptList } from './attempt-list'
import { formatRawScore, formatScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import { studentStatus } from '@/domain/scoring/status'
import { StudentStatusPill } from './student-status-pill'

type StudentTabProps = Readonly<{
  ui: Ui
  session: Session
  student: Student | undefined
  /** Notes de `student`, calculées par `ExaminerView` ; définies dès que `student` l'est. */
  scores: ScoreBreakdown | undefined
  disabled: boolean
  onEditScore: (attemptId: string, score: number) => void
}>

/**
 * Onglet « Cet étudiant » (artboard `passage-panneau-etudiant`) : nom et statut, questions (notes
 * éditables, D103) et totaux (brute sur le maximum, finale sur l'échelle). Le commentaire et
 * l'absence sont sur la page, dans la colonne de droite (F44.7).
 */
export function StudentTab({
  ui,
  session,
  student,
  scores,
  disabled,
  onEditScore,
}: StudentTabProps) {
  const { text, locale } = ui
  if (student === undefined || scores === undefined) {
    return <p className="text-muted-foreground">{text('student_tab_no_student', {})}</p>
  }
  const { config } = session
  const raw = text('final_score', {
    value: formatRawScore(scores.raw, locale),
    scale: formatRawScore(toMilli(config.scoring.maxRawScore), locale),
  })
  const final =
    scores.final === null
      ? text('score_not_computed', {})
      : text('final_score', {
          value: formatScore(scores.final, 'final', config, locale),
          scale: formatRawScore(toMilli(config.scoring.finalScale), locale),
        })
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-lg font-semibold">
          {`${student.lastName} ${student.firstName}`}
        </span>
        <StudentStatusPill ui={ui} status={studentStatus(student, config)} />
      </div>
      <section className="flex flex-col gap-2">
        <h3 className="text-label text-muted-foreground uppercase">
          {text('student_tab_questions', {})}
        </h3>
        {student.attempts.length === 0 ? (
          <p className="text-muted-foreground">{text('student_tab_no_attempts', {})}</p>
        ) : (
          <AttemptList
            ui={ui}
            config={config}
            attempts={student.attempts}
            disabled={disabled}
            onEditScore={onEditScore}
          />
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-label text-muted-foreground uppercase">
          {text('student_tab_totals', {})}
        </h3>
        <dl className="flex flex-col text-body">
          <div className="flex justify-between gap-3 py-2">
            <dt className="text-muted-foreground">{text('final_raw', {})}</dt>
            <dd className="font-semibold tabular-nums">{raw}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t py-2">
            <dt className="text-muted-foreground">{text('final_final', {})}</dt>
            <dd className="font-semibold tabular-nums">{final}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
