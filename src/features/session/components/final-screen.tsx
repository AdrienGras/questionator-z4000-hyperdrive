import { useState, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { nextStudent } from '@/domain/passage/selectors'
import { formatScore } from '@/domain/scoring/format'
import { asMilli, toMilli, type Milli } from '@/domain/scoring/milli'
import { computeScores } from '@/domain/scoring/score'
import type { Attempt, Session, Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { ResetDialog } from './reset-dialog'

type FinalScreenProps = Readonly<{
  ui: Ui
  session: Session
  student: Student
  disabled: boolean
  onAdjust: () => void
  onReset: () => Promise<void>
  onNext: () => void
}>

/** Ajustement signé au format des notes finales : « +1,0 », « −0,5 » (moins typographique). */
function signedAdjustment(value: Milli, config: NormalizedConfig, ui: Ui): string {
  if (value === 0) return formatScore(value, 'final', config, ui.locale)
  const magnitude = formatScore(asMilli(Math.abs(value)), 'final', config, ui.locale)
  return `${value > 0 ? '+' : '−'}${magnitude}`
}

function ScoreRow({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}

type AttemptRowProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  attempt: Attempt
  rank: number | undefined
}>

function AttemptRow({ ui, config, attempt, rank }: AttemptRowProps) {
  const { text, locale } = ui
  const category = config.categories.find((c) => c.id === attempt.categoryId)
  const question = category?.questions.find((q) => q.id === attempt.questionId)
  const color = category?.color
  const accent: (CSSProperties & Record<'--category-color', string>) | undefined =
    color === undefined ? undefined : { '--category-color': color }

  let outcome = ''
  if (attempt.outcome === 'scored' && attempt.score !== undefined) {
    const max = category === undefined ? 0 : Math.max(...category.scale)
    outcome = text('final_points', {
      score: formatScore(toMilli(attempt.score), 'raw', config, locale),
      max: formatScore(toMilli(max), 'raw', config, locale),
    })
  } else if (attempt.skipReason === undefined || attempt.skipReason === '') {
    outcome = text('final_skipped', {})
  } else {
    outcome = text('final_skipped_reason', { reason: attempt.skipReason })
  }

  return (
    <li
      style={accent}
      data-colored={color !== undefined}
      className="flex flex-wrap items-baseline gap-x-3 border-l-4 border-border pl-3 data-[colored=true]:border-[var(--category-color)]"
    >
      {rank !== undefined && <span className="tabular-nums">{`${rank}.`}</span>}
      <span className="font-medium">{category?.label ?? attempt.categoryId}</span>
      <span className="flex-1">{question?.title ?? attempt.questionId}</span>
      <span className="tabular-nums">{outcome}</span>
    </li>
  )
}

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
  onReset,
  onNext,
}: FinalScreenProps) {
  const { text, locale } = ui
  const { config } = session
  const [resetOpen, setResetOpen] = useState(false)
  const scores = computeScores(student, config)
  const hasNext = nextStudent(session, student.id) !== null
  const fmtRaw = (value: Milli) => formatScore(value, 'raw', config, locale)
  const fmtFinal = (value: Milli | null) =>
    value === null ? '' : formatScore(value, 'final', config, locale)
  const scale = fmtRaw(toMilli(config.scoring.finalScale))

  const rows = student.attempts.map((attempt, index) => {
    const rank =
      attempt.outcome === 'scored'
        ? student.attempts.slice(0, index + 1).filter((a) => a.outcome === 'scored').length
        : undefined
    return <AttemptRow key={attempt.id} ui={ui} config={config} attempt={attempt} rank={rank} />
  })

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">{text('passage_done_title', {})}</h2>

      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">{text('final_scores_heading', {})}</h3>
        <dl className="flex flex-col gap-1">
          <ScoreRow label={text('final_raw', {})}>{fmtRaw(scores.raw)}</ScoreRow>
          <ScoreRow label={text('final_capped', {})}>{fmtRaw(scores.capped)}</ScoreRow>
          <ScoreRow label={text('final_converted', {})}>{fmtFinal(scores.converted)}</ScoreRow>
          <ScoreRow label={text('final_adjustment', {})}>
            {student.adjustment === undefined
              ? text('final_no_adjustment', {})
              : signedAdjustment(scores.adjustment, config, ui)}
            {student.adjustment?.reason !== undefined && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {student.adjustment.reason}
              </span>
            )}
          </ScoreRow>
          <ScoreRow label={text('final_final', {})}>
            <span className="text-2xl font-bold">
              {text('final_score', { value: fmtFinal(scores.final), scale })}
            </span>
          </ScoreRow>
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">{text('final_detail_heading', {})}</h3>
        <ol className="flex flex-col gap-2">{rows}</ol>
      </section>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={disabled} onClick={onAdjust}>
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
