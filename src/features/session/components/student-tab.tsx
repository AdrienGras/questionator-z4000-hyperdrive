import type { ScoreBreakdown } from '@/domain/scoring/score'
import type { Session, Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { AttemptList } from './attempt-list'
import { ScoreList } from './score-list'

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
 * Onglet « Étudiant » : questions (notes éditables) et totaux. Le commentaire et l'absence sont sur
 * la page, dans la colonne de droite (F44.7).
 */
export function StudentTab({
  ui,
  session,
  student,
  scores,
  disabled,
  onEditScore,
}: StudentTabProps) {
  const { text } = ui
  if (student === undefined || scores === undefined) {
    return <p className="text-muted-foreground">{text('student_tab_no_student', {})}</p>
  }
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">{text('student_tab_questions', {})}</h3>
        {student.attempts.length === 0 ? (
          <p className="text-muted-foreground">{text('student_tab_no_attempts', {})}</p>
        ) : (
          <AttemptList
            ui={ui}
            config={session.config}
            attempts={student.attempts}
            disabled={disabled}
            onEditScore={onEditScore}
          />
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">{text('student_tab_totals', {})}</h3>
        <ScoreList ui={ui} config={session.config} student={student} scores={scores} />
      </section>
    </div>
  )
}
