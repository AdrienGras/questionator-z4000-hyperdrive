import type { CSSProperties } from 'react'
import { CategoryBadge } from '@/components/category-badge'
import { cn } from '@/lib/utils'
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
  /** `panel` : onglet « Cet étudiant » (note éditable) ; `final` : détail de l'écran final. */
  variant?: 'panel' | 'final'
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
    <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
      <select
        aria-label={text('attempt_score_label', { rank })}
        value={String(attempt.score)}
        disabled={disabled}
        onChange={(event) => onEditScore(attempt.id, Number(event.target.value))}
        className="h-9 rounded-[10px] border border-input bg-background px-2 text-sm font-semibold"
      >
        {(category?.scale ?? []).map((value) => (
          <option key={value} value={String(value)}>
            {fmt(value)}
          </option>
        ))}
      </select>
      <span className="text-small text-muted-foreground">
        {text('attempt_out_of', { max: fmt(maxOf(category)) })}
      </span>
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
  const editable =
    onEditScore !== undefined &&
    rank !== undefined &&
    attempt.outcome === 'scored' &&
    attempt.score !== undefined

  return (
    <li className="flex items-center gap-3 border-t py-2.5 first:border-t-0">
      <span className="w-3.5 shrink-0 text-small text-muted-foreground tabular-nums">
        {rank ?? '–'}
      </span>
      <CategoryBadge color={category?.color} icon={category?.icon} size="md" />
      <span className="flex min-w-0 flex-1 flex-col wrap-anywhere">
        <span className="font-semibold">{question?.title ?? attempt.questionId}</span>
        <span className="text-small text-muted-foreground">
          {category?.label ?? attempt.categoryId}
        </span>
      </span>
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
        <span className="text-small font-semibold text-muted-foreground tabular-nums">
          {outcomeText(ui, config, attempt, category)}
        </span>
      )}
    </li>
  )
}

/**
 * Ligne du détail de l'écran final (artboard `passage-note-finale`) : points sur le maximum et
 * barre au prorata dans la couleur de la catégorie ; une question passée garde son motif sous le
 * titre, hors note, et une pastille « Passée ».
 */
function FinalAttemptRow({
  ui,
  config,
  attempt,
  category,
  rank,
}: Pick<AttemptRowProps, 'ui' | 'config' | 'attempt' | 'category' | 'rank'>) {
  const { text, locale } = ui
  const question = category?.questions.find((q) => q.id === attempt.questionId)
  const label = category?.label ?? attempt.categoryId
  const skipped = attempt.outcome === 'skipped'
  const reason = skipped && attempt.skipReason !== undefined && attempt.skipReason !== ''
  const max = maxOf(category)
  const score = attempt.outcome === 'scored' ? attempt.score : undefined
  const bar: (CSSProperties & Record<'--category-color', string>) | CSSProperties = {
    width: `${max > 0 && score !== undefined ? Math.round((score / max) * 100) : 0}%`,
    ...(category?.color !== undefined && { '--category-color': category.color }),
  }
  return (
    <li className="flex items-center gap-3.5 border-t py-3 first:border-t-0">
      <span className="w-4 shrink-0 text-small text-muted-foreground tabular-nums">
        {rank ?? '–'}
      </span>
      <CategoryBadge
        color={category?.color}
        icon={category?.icon}
        size="lg"
        className={cn(skipped && 'opacity-60')}
      />
      <span className="flex min-w-0 flex-1 flex-col wrap-anywhere">
        <span className={cn('font-semibold', skipped && 'text-muted-foreground')}>
          {question?.title ?? attempt.questionId}
        </span>
        <span className="text-small text-muted-foreground">
          {reason ? `${label} · ${attempt.skipReason}` : label}
        </span>
      </span>
      {skipped ? (
        <span className="flex w-24 shrink-0 justify-end">
          <span className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-label text-muted-foreground">
            {text('final_skipped', {})}
          </span>
        </span>
      ) : (
        <span className="flex w-24 shrink-0 flex-col items-end gap-1.5">
          <span className="font-bold tabular-nums">
            {score === undefined
              ? text('attempt_pending', {})
              : formatScore(toMilli(score), 'raw', config, locale)}{' '}
            <span className="font-normal text-muted-foreground">
              {text('attempt_out_of', { max: formatScore(toMilli(max), 'raw', config, locale) })}
            </span>
          </span>
          {score !== undefined && (
            <span aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <span
                data-bar
                style={bar}
                className="block h-full rounded-full bg-[var(--category-color,var(--color-primary))]"
              />
            </span>
          )}
        </span>
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
  variant = 'panel',
}: AttemptListProps) {
  const rows = attempts.map((attempt, index) => {
    const rank =
      attempt.outcome === 'scored'
        ? attempts.slice(0, index + 1).filter((a) => a.outcome === 'scored').length
        : undefined
    const category = config.categories.find((c) => c.id === attempt.categoryId)
    if (variant === 'final') {
      return (
        <FinalAttemptRow
          key={attempt.id}
          ui={ui}
          config={config}
          attempt={attempt}
          category={category}
          rank={rank}
        />
      )
    }
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
  return <ol className="flex flex-col">{rows}</ol>
}
