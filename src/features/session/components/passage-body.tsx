import type { NormalizedConfig } from '@/domain/config/normalize'
import { skipsRemaining } from '@/domain/passage/skip'
import { Button } from '@/components/ui/button'
import type { Attempt, Session, Student } from '@/domain/session/types'
import type { SidePanelTab } from '@/features/session/hooks/use-side-panel'
import type { StudentStanding } from '@/features/session/student-standing'
import type { WriteOutcome } from '@/features/session/hooks/use-passage-actions'
import type { Ui } from '@/lib/i18n/use-ui'
import { AbsentState } from './absent-state'
import { CategoryGrid } from './category-grid'
import { FinalScreen } from './final-screen'
import { QuestionPanel } from './question-panel'

type PassageBodyProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  session: Session
  student: Student | undefined
  /** Statut et notes de `student`, calculés par `ExaminerView`. */
  standing: StudentStanding | undefined
  pending: Attempt | undefined
  disabled: boolean
  onDraw: (categoryId: string) => void
  onScore: (attemptId: string, value: number) => void
  onSkip: (attemptId: string, reason: string | undefined) => void
  onAdjust: (
    value: number,
    reason: string | undefined,
    options: { reveal: boolean },
  ) => Promise<WriteOutcome>
  onRevealFinal: () => Promise<WriteOutcome>
  onReset: () => Promise<WriteOutcome>
  onNext: () => void
  onShowPanel: (tab: SidePanelTab) => void
}>

/**
 * Aiguillage par statut de l'étudiant actif (spec F09 §7), en if/return plutôt qu'en ternaires
 * imbriqués (Sonar S3358).
 */
export function PassageBody({
  ui,
  config,
  session,
  student,
  standing,
  pending,
  disabled,
  onDraw,
  onScore,
  onSkip,
  onAdjust,
  onRevealFinal,
  onReset,
  onNext,
  onShowPanel,
}: PassageBodyProps) {
  const { text } = ui

  if (student === undefined) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{text('passage_no_student_title', {})}</h2>
        <p className="text-muted-foreground">{text('passage_no_student_body', {})}</p>
        <Button variant="outline" className="self-start" onClick={() => onShowPanel('students')}>
          {text('side_panel_show', {})}
        </Button>
      </div>
    )
  }

  if (standing?.status === 'absent') return <AbsentState ui={ui} onShowPanel={onShowPanel} />

  if (standing?.status === 'done') {
    return (
      <FinalScreen
        // Un autre étudiant terminé repart sans popup ouverte à la main.
        key={student.id}
        ui={ui}
        session={session}
        student={student}
        scores={standing.scores}
        disabled={disabled}
        onAdjust={onAdjust}
        onRevealFinal={onRevealFinal}
        onReset={onReset}
        onNext={onNext}
      />
    )
  }

  return (
    <>
      {pending !== undefined && (
        <QuestionPanel
          ui={ui}
          config={config}
          attempt={pending}
          disabled={disabled}
          skipsRemaining={skipsRemaining(student, config)}
          onScore={onScore}
          onSkip={onSkip}
        />
      )}
      <CategoryGrid
        ui={ui}
        config={config}
        student={student}
        disabled={pending !== undefined || disabled}
        onDraw={onDraw}
      />
    </>
  )
}
