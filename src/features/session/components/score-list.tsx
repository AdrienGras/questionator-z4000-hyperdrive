import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import { asMilli, toMilli, type Milli } from '@/domain/scoring/milli'
import type { ScoreBreakdown } from '@/domain/scoring/score'
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
    <div className="flex items-baseline justify-between gap-3 border-b py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  )
}

/**
 * Notes d'un étudiant terminé, à côté de la jauge de l'écran final (artboard `passage-note-finale`) :
 * brute sur le maximum, plafonnée, convertie, ajustement signé et sa justification. La note finale
 * est dans la jauge. `scores` : `computeScores(student, config)`, calculé une fois par l'appelant.
 */
export function ScoreList({
  ui,
  config,
  student,
  scores,
}: Readonly<{ ui: Ui; config: NormalizedConfig; student: Student; scores: ScoreBreakdown }>) {
  const { text, locale } = ui
  const fmtRaw = (value: Milli) => formatScore(value, 'raw', config, locale)
  const fmtFinal = (value: Milli | null) =>
    value === null ? text('score_not_computed', {}) : formatScore(value, 'final', config, locale)

  return (
    <dl className="flex min-w-0 flex-[1_1_15rem] flex-col">
      <ScoreRow label={text('final_raw', {})}>
        {fmtRaw(scores.raw)}{' '}
        <span className="font-normal text-muted-foreground">
          {text('attempt_out_of', { max: fmtRaw(toMilli(config.scoring.maxRawScore)) })}
        </span>
      </ScoreRow>
      <ScoreRow label={text('final_capped', {})}>{fmtRaw(scores.capped)}</ScoreRow>
      <ScoreRow label={text('final_converted', {})}>{fmtFinal(scores.converted)}</ScoreRow>
      <ScoreRow label={text('final_adjustment', {})}>
        {student.adjustment === undefined || student.adjustment.value === 0
          ? text('final_no_adjustment', {})
          : signedAdjustment(scores.adjustment, config, ui)}
        {student.adjustment?.reason !== undefined && (
          <span className="block text-small font-normal text-muted-foreground">
            {student.adjustment.reason}
          </span>
        )}
      </ScoreRow>
    </dl>
  )
}
