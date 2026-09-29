import type { ReactNode } from 'react'
import type { Session, Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { AttemptList } from './attempt-list'
import { ScoreList } from './score-list'

type StudentTabProps = Readonly<{
  ui: Ui
  session: Session
  student: Student | undefined
  disabled: boolean
  onEditScore: (attemptId: string, score: number) => void
  /** `CommentField` de l'étudiant, monté par l'appelant avec `key={student.id}`. */
  commentSlot?: ReactNode
  /** `AbsentToggle` de l'étudiant. */
  absentSlot?: ReactNode
}>

/** Onglet « Étudiant » : questions (notes éditables), totaux, puis commentaire et absence. */
export function StudentTab({
  ui,
  session,
  student,
  disabled,
  onEditScore,
  commentSlot,
  absentSlot,
}: StudentTabProps) {
  const { text } = ui
  if (student === undefined) {
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
        <ScoreList ui={ui} config={session.config} student={student} />
      </section>
      {commentSlot}
      {absentSlot}
    </div>
  )
}
