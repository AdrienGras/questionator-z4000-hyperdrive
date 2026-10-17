import { useState } from 'react'
import { IconAdjustments, IconArrowRight, IconRotate } from '@tabler/icons-react'
import { ActionHalo } from '@/components/action-halo'
import { ScoreGauge } from '@/components/score-gauge'
import { Button } from '@/components/ui/button'
import { nextStudent, shouldAutoOpenAdjustment } from '@/domain/passage/selectors'
import { formatRawScore, formatScore } from '@/domain/scoring/format'
import { fromMilli, toMilli } from '@/domain/scoring/milli'
import type { ScoreBreakdown } from '@/domain/scoring/score'
import type { Session, Student } from '@/domain/session/types'
import type { WriteOutcome } from '@/features/session/hooks/use-passage-actions'
import type { Ui } from '@/lib/i18n/use-ui'
import { AdjustmentDialog } from './adjustment-dialog'
import { AttemptList } from './attempt-list'
import { ExportButton } from './export-button'
import { ResetDialog } from './reset-dialog'
import { ScoreList } from './score-list'

type FinalScreenProps = Readonly<{
  ui: Ui
  session: Session
  student: Student
  /** Notes de `student`, calculées par `ExaminerView`. */
  scores: ScoreBreakdown
  disabled: boolean
  onAdjust: (
    value: number,
    reason: string | undefined,
    options: { reveal: boolean },
  ) => Promise<WriteOutcome>
  onRevealFinal: () => Promise<WriteOutcome>
  onReset: () => Promise<WriteOutcome>
  onNext: () => void
}>

/**
 * Écran final d'un étudiant `done` (F11, artboard `passage-note-finale`) : note finale en jauge et
 * notes intermédiaires, détail du passage en barres, puis « Étudiant suivant » sous son halo et
 * l'export. `presentation.finalScoreDisplay` ne s'applique pas ici (D29). Le titre « Passage
 * terminé » est lu par les lecteurs d'écran ; la pastille de l'en-tête le montre.
 */
export function FinalScreen({
  ui,
  session,
  student,
  scores,
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

  const { locale } = ui
  const scale = formatRawScore(toMilli(config.scoring.finalScale), locale)
  const final =
    scores.final === null
      ? text('score_not_computed', {})
      : formatScore(scores.final, 'final', config, locale)

  return (
    <div className="flex flex-col gap-6">
      <h2 className="sr-only">{text('passage_done_title', {})}</h2>

      <section
        aria-label={text('final_scores_heading', {})}
        className="flex flex-col gap-4 rounded-lg bg-card p-7 shadow-card"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-label text-muted-foreground uppercase">
            {text('final_final', {})}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-mr-2 text-muted-foreground"
            disabled={disabled}
            onClick={() => setAdjustOpen(true)}
          >
            <IconAdjustments aria-hidden />
            {text('final_adjust', {})}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          <ScoreGauge
            size="md"
            ratio={
              scores.final === null
                ? undefined
                : fromMilli(scores.final) / config.scoring.finalScale
            }
            label={text('final_gauge_label', { value: final, scale })}
          >
            <span className="text-score-xl tabular-nums">{final}</span>
            <span className="text-small text-muted-foreground">
              {text('final_gauge_scale', { scale })}
            </span>
          </ScoreGauge>
          <ScoreList ui={ui} config={config} student={student} scores={scores} />
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-lg bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-h3">{text('final_detail_heading', {})}</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-mr-2 text-destructive hover:text-destructive"
            disabled={disabled}
            onClick={() => setResetOpen(true)}
          >
            <IconRotate aria-hidden />
            {text('final_reset', {})}
          </Button>
        </div>
        <AttemptList ui={ui} config={config} attempts={student.attempts} variant="final" />
      </section>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <ActionHalo side="start">
            <Button type="button" disabled={disabled || !hasNext} onClick={onNext}>
              {text('final_next', {})}
              <IconArrowRight aria-hidden />
            </Button>
          </ActionHalo>
          <ExportButton ui={ui} session={session} />
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
