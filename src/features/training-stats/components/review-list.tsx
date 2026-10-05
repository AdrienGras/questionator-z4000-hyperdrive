import { StatsEmpty } from '@/components/stats/stats-empty'
import { StatsSection } from '@/components/stats/stats-section'
import type { QuestionStats } from '@/domain/training/training-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { formatLastScore } from './format-last-score'

type ReviewListProps = Readonly<{
  ui: Ui
  /** Toutes les questions des stats : on n'affiche que celles « à revoir ». */
  questions: QuestionStats[]
  /** Libellé du niveau par id de catégorie. */
  levels: ReadonlyMap<string, string>
}>

/** Questions dont la dernière note est sous la moitié du max : niveau, titre, note, passages. */
export function ReviewList({ ui, questions, levels }: ReviewListProps) {
  const { text, locale } = ui
  const toReview = questions.filter((q) => q.toReview)
  return (
    <StatsSection title={text('training_stats_review_title', {})}>
      {(headingId) =>
        toReview.length === 0 ? (
          <StatsEmpty>{text('training_stats_review_empty', {})}</StatsEmpty>
        ) : (
          <ul aria-labelledby={headingId} className="flex flex-col divide-y">
            {toReview.map((q) => (
              <li key={q.questionId} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                <span className="font-medium wrap-anywhere">{q.title}</span>
                <span className="text-sm text-muted-foreground">
                  {[
                    levels.get(q.categoryId) ?? q.categoryId,
                    text('training_stats_last_score', { score: formatLastScore(q.last, locale) }),
                    text('training_stats_attempts', { count: q.scoredCount }),
                  ].join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        )
      }
    </StatsSection>
  )
}
