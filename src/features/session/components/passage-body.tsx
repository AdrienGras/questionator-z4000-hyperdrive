import type { ReactNode } from 'react'
import type { NormalizedConfig } from '@/domain/config/normalize'
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
  onAdjust: (
    value: number,
    reason: string | undefined,
    options: { reveal: boolean },
  ) => Promise<WriteOutcome>
  onRevealFinal: () => Promise<WriteOutcome>
  onReset: () => Promise<WriteOutcome>
  onNext: () => void
  onShowPanel: (tab: SidePanelTab) => void
  /** Alerte de la dernière action refusée, au-dessus du contenu principal. */
  alert?: ReactNode
  /** Colonne de droite : vue projetée, carte « Note », commentaire. */
  aside: ReactNode
}>

/**
 * Grille de l'écran de passage (artboards `passage-question`, `passage-note-finale`) : contenu
 * principal en haut à gauche, colonne de droite sur deux rangées, suite (tirage) en bas à gauche.
 * Sur écran étroit, une colonne : principal, droite (carte « Note » en tête), suite.
 */
function PassageLayout({
  primary,
  secondary,
  aside,
}: Readonly<{ primary: ReactNode; secondary?: ReactNode; aside: ReactNode }>) {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_25rem] lg:grid-rows-[auto_1fr] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">{primary}</div>
      <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        {aside}
      </div>
      {secondary !== undefined && (
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">{secondary}</div>
      )}
    </div>
  )
}

/**
 * Aiguillage par statut de l'étudiant actif (spec F09 §7), en if/return plutôt qu'en ternaires
 * imbriqués (Sonar S3358), posé dans la grille de l'écran avec la colonne de droite.
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
  onAdjust,
  onRevealFinal,
  onReset,
  onNext,
  onShowPanel,
  alert,
  aside,
}: PassageBodyProps) {
  const { text } = ui

  if (student === undefined) {
    return (
      <PassageLayout
        aside={aside}
        primary={
          <>
            {alert}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{text('passage_no_student_title', {})}</h2>
              <p className="text-muted-foreground">{text('passage_no_student_body', {})}</p>
              <Button
                variant="outline"
                className="self-start"
                onClick={() => onShowPanel('students')}
              >
                {text('side_panel_show', {})}
              </Button>
            </div>
          </>
        }
      />
    )
  }

  if (standing?.status === 'absent') {
    return (
      <PassageLayout
        aside={aside}
        primary={
          <>
            {alert}
            <AbsentState ui={ui} onShowPanel={onShowPanel} />
          </>
        }
      />
    )
  }

  if (standing?.status === 'done') {
    return (
      <PassageLayout
        aside={aside}
        primary={
          <>
            {alert}
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
          </>
        }
      />
    )
  }

  return (
    <PassageLayout
      aside={aside}
      primary={
        <>
          {alert}
          {pending !== undefined && <QuestionPanel ui={ui} config={config} attempt={pending} />}
        </>
      }
      secondary={
        <CategoryGrid
          ui={ui}
          config={config}
          student={student}
          disabled={pending !== undefined || disabled}
          pending={pending !== undefined}
          onDraw={onDraw}
        />
      }
    />
  )
}
