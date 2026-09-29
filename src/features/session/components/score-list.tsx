import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import { asMilli, toMilli, type Milli } from '@/domain/scoring/milli'
import { computeScores } from '@/domain/scoring/score'
import type { Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

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

/** Les cinq notes d'un étudiant ; « — » tant que la note convertie n'est pas calculable. */
export function ScoreList({
  ui,
  config,
  student,
}: Readonly<{ ui: Ui; config: NormalizedConfig; student: Student }>) {
  const { text, locale } = ui
  const scores = computeScores(student, config)
  const fmtRaw = (value: Milli) => formatScore(value, 'raw', config, locale)
  const fmtFinal = (value: Milli | null) =>
    value === null ? text('score_not_computed', {}) : formatScore(value, 'final', config, locale)
  const scale = fmtRaw(toMilli(config.scoring.finalScale))
  const finalText =
    scores.final === null
      ? text('score_not_computed', {})
      : text('final_score', { value: fmtFinal(scores.final), scale })

  return (
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
        <span className="text-2xl font-bold">{finalText}</span>
      </ScoreRow>
    </dl>
  )
}
