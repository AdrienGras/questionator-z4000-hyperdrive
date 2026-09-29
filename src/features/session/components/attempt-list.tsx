import type { CSSProperties } from 'react'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Attempt } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

type AttemptListProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  attempts: readonly Attempt[]
  disabled?: boolean
  onEditScore?: (attemptId: string, score: number) => void
}>

type AttemptRowProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  attempt: Attempt
  category: NormalizedCategory | undefined
  rank: number | undefined
  disabled: boolean
  onEditScore: ((attemptId: string, score: number) => void) | undefined
}>

function maxOf(category: NormalizedCategory | undefined): number {
  return category === undefined ? 0 : Math.max(...category.scale)
}

/** Résultat d'une question : points sur le maximum du barème, « passée » avec motif, ou « en cours ». */
function outcomeText(
  ui: Ui,
  config: NormalizedConfig,
  attempt: Attempt,
  category: NormalizedCategory | undefined,
): string {
  const { text, locale } = ui
  if (attempt.outcome === 'pending') return text('attempt_pending', {})
  if (attempt.outcome === 'scored' && attempt.score !== undefined) {
    return text('final_points', {
      score: formatScore(toMilli(attempt.score), 'raw', config, locale),
      max: formatScore(toMilli(maxOf(category)), 'raw', config, locale),
    })
  }
  if (attempt.skipReason === undefined || attempt.skipReason === '') {
    return text('final_skipped', {})
  }
  return text('final_skipped_reason', { reason: attempt.skipReason })
}

function ScoreSelect({
  ui,
  config,
  attempt,
  category,
  rank,
  disabled,
  onEditScore,
}: Readonly<{
  ui: Ui
  config: NormalizedConfig
  attempt: Attempt
  category: NormalizedCategory | undefined
  rank: number
  disabled: boolean
  onEditScore: (attemptId: string, score: number) => void
}>) {
  const { text, locale } = ui
  const fmt = (value: number) => formatScore(toMilli(value), 'raw', config, locale)
  return (
    <span className="flex items-baseline gap-1 tabular-nums">
      <select
        aria-label={text('attempt_score_label', { rank })}
        value={String(attempt.score)}
        disabled={disabled}
        onChange={(event) => onEditScore(attempt.id, Number(event.target.value))}
        className="rounded-md border border-input bg-background px-2 py-1"
      >
        {(category?.scale ?? []).map((value) => (
          <option key={value} value={String(value)}>
            {fmt(value)}
          </option>
        ))}
      </select>
      <span>{text('attempt_out_of', { max: fmt(maxOf(category)) })}</span>
    </span>
  )
}

function AttemptRow({
  ui,
  config,
  attempt,
  category,
  rank,
  disabled,
  onEditScore,
}: AttemptRowProps) {
  const question = category?.questions.find((q) => q.id === attempt.questionId)
  const color = category?.color
  const accent: (CSSProperties & Record<'--category-color', string>) | undefined =
    color === undefined ? undefined : { '--category-color': color }
  const editable =
    onEditScore !== undefined &&
    rank !== undefined &&
    attempt.outcome === 'scored' &&
    attempt.score !== undefined

  return (
    <li
      style={accent}
      data-colored={color !== undefined}
      className="flex flex-wrap items-baseline gap-x-3 border-l-4 border-border pl-3 data-[colored=true]:border-[var(--category-color)]"
    >
      {rank !== undefined && <span className="tabular-nums">{`${rank}.`}</span>}
      <span className="font-medium">{category?.label ?? attempt.categoryId}</span>
      <span className="flex-1">{question?.title ?? attempt.questionId}</span>
      {editable ? (
        <ScoreSelect
          ui={ui}
          config={config}
          attempt={attempt}
          category={category}
          rank={rank}
          disabled={disabled}
          onEditScore={onEditScore}
        />
      ) : (
        <span className="tabular-nums">{outcomeText(ui, config, attempt, category)}</span>
      )}
    </li>
  )
}

/** Liste des questions d'un passage : rang des seules questions notées, note éditable si demandé. */
export function AttemptList({
  ui,
  config,
  attempts,
  disabled = false,
  onEditScore,
}: AttemptListProps) {
  const rows = attempts.map((attempt, index) => {
    const rank =
      attempt.outcome === 'scored'
        ? attempts.slice(0, index + 1).filter((a) => a.outcome === 'scored').length
        : undefined
    const category = config.categories.find((c) => c.id === attempt.categoryId)
    return (
      <AttemptRow
        key={attempt.id}
        ui={ui}
        config={config}
        attempt={attempt}
        category={category}
        rank={rank}
        disabled={disabled}
        onEditScore={onEditScore}
      />
    )
  })
  return <ol className="flex flex-col gap-2">{rows}</ol>
}
