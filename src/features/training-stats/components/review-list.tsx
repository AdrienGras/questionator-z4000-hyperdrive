import { IconAlertTriangle } from '@tabler/icons-react'
import { CategoryLabel } from '@/components/stats/category-label'
import { StatsEmpty } from '@/components/stats/stats-empty'
import { StatsSection } from '@/components/stats/stats-section'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { QuestionStats } from '@/domain/training/training-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { formatLastScore } from './format-last-score'

type ReviewListProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  /** Toutes les questions des stats : on n'affiche que celles « à revoir ». */
  questions: QuestionStats[]
}>

/** Questions dont la dernière note est sous la moitié du max : titre, niveau, note, passages. */
export function ReviewList({ ui, config, questions }: ReviewListProps) {
  const { text, locale } = ui
  const toReview = questions.filter((q) => q.toReview)
  return (
    <StatsSection
      title={text('training_stats_review_title', {})}
      icon={<IconAlertTriangle aria-hidden className="size-5 shrink-0 text-destructive" />}
      aside={
        toReview.length > 0 && (
          <span className="text-small text-muted-foreground">
            {text('training_stats_review_count', { count: toReview.length })}
          </span>
        )
      }
    >
      {(headingId) =>
        toReview.length === 0 ? (
          <StatsEmpty>{text('training_stats_review_empty', {})}</StatsEmpty>
        ) : (
          <ul aria-labelledby={headingId}>
            {toReview.map((q) => (
              <li
                key={q.questionId}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t py-3.5"
              >
                <span className="flex min-w-0 flex-[1_1_16.25rem] flex-col gap-0.5">
                  <span className="font-semibold wrap-anywhere">{q.title}</span>
                  <CategoryLabel config={config} categoryId={q.categoryId} />
                </span>
                <span className="text-small text-muted-foreground tabular-nums">
                  {text('training_stats_last_score', {})}{' '}
                  <b className="text-foreground">{formatLastScore(q.last, locale)}</b>
                  {' · '}
                  {text('training_stats_attempts', { count: q.scoredCount })}
                </span>
              </li>
            ))}
          </ul>
        )
      }
    </StatsSection>
  )
}
