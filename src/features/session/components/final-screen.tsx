import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { nextStudent, shouldAutoOpenAdjustment } from '@/domain/passage/selectors'
import type { Session, Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { AdjustmentDialog } from './adjustment-dialog'
import { AttemptList } from './attempt-list'
import { ResetDialog } from './reset-dialog'
import { ScoreList } from './score-list'

type FinalScreenProps = Readonly<{
  ui: Ui
  session: Session
  student: Student
  disabled: boolean
  onAdjust: (
    value: number,
    reason: string | undefined,
    options: { reveal: boolean },
  ) => Promise<boolean>
  onRevealFinal: () => Promise<boolean>
  onReset: () => Promise<boolean>
  onNext: () => void
}>

/**
 * Écran final d'un étudiant `done` (F11) : notes, détail du passage et actions. `presentation.
 * finalScoreDisplay` ne s'applique pas ici (D29).
 */
export function FinalScreen({
  ui,
  session,
  student,
  disabled,
  onAdjust,
  onRevealFinal,
  onReset,
  onNext,
}: FinalScreenProps) {
  const { text } = ui
  const { config } = session
  const [resetOpen, setResetOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  // Ouverture automatique déduite de la base (D66) : tant que la note n'est pas révélée, la popup
  // de fin de passage reste ouverte ; l'enregistrer ou l'annuler renseigne `finalRevealedAt`.
  const autoOpen = shouldAutoOpenAdjustment(student, config)
  const adjustMode = autoOpen ? 'final' : 'adjust'
  const hasNext = nextStudent(session, student.id) !== null

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">{text('passage_done_title', {})}</h2>

      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">{text('final_scores_heading', {})}</h3>
        <ScoreList ui={ui} config={config} student={student} />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">{text('final_detail_heading', {})}</h3>
        <AttemptList ui={ui} config={config} attempts={student.attempts} />
      </section>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => setAdjustOpen(true)}
          >
            {text('final_adjust', {})}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={disabled}
            onClick={() => setResetOpen(true)}
          >
            {text('final_reset', {})}
          </Button>
          <Button type="button" disabled={disabled || !hasNext} onClick={onNext}>
            {text('final_next', {})}
          </Button>
        </div>
        {!hasNext && <p className="text-sm text-muted-foreground">{text('final_no_next', {})}</p>}
      </div>

      <AdjustmentDialog
        ui={ui}
        config={config}
        student={student}
        open={autoOpen || adjustOpen}
        mode={adjustMode}
        onSave={(value, reason) => onAdjust(value, reason, { reveal: adjustMode === 'final' })}
        onCancel={onRevealFinal}
        onClose={() => setAdjustOpen(false)}
      />
      <ResetDialog
        ui={ui}
        studentName={`${student.lastName} ${student.firstName}`}
        open={resetOpen}
        onOpenChange={setResetOpen}
        onConfirm={onReset}
      />
    </div>
  )
}
