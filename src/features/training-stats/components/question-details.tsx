import { useId } from 'react'
import { CategoryLabel } from '@/components/stats/category-label'
import { CELL, NUMERIC_CELL, ROW_HEADER, StatsTable } from '@/components/stats/stats-section'
import { findCategory } from '@/domain/config/lookup'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { QuestionStats } from '@/domain/training/training-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import { formatLastScore } from './format-last-score'
import { RateCell } from './rate-cell'

type QuestionDetailsProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  questions: QuestionStats[]
}>

/** Chiffres du détail : sans graisse, contrairement aux autres tableaux de stats. */
const PLAIN_NUMERIC = cn(NUMERIC_CELL, 'font-normal')

/** Détail de toutes les questions, replié par défaut (`<details>` natif) ; « à revoir » en tête. */
export function QuestionDetails({ ui, config, questions }: QuestionDetailsProps) {
  const { text, locale } = ui
  const summaryId = useId()
  return (
    <div className="rounded-lg bg-card p-6 text-card-foreground shadow-card">
      <details>
        <summary id={summaryId} className="cursor-pointer text-h2">
          {text('training_stats_details', { count: questions.length })}
        </summary>
        <div className="mt-4">
          <StatsTable
            labelledBy={summaryId}
            columns={[
              { label: text('training_stats_col_level', {}) },
              { label: text('training_stats_col_question', {}) },
              { label: text('training_stats_col_scored', {}), numeric: true },
              { label: text('training_stats_col_last', {}), numeric: true },
              { label: text('training_stats_col_rate', {}), numeric: true },
              { label: text('training_stats_col_status', {}) },
            ]}
          >
            {questions.map((q) => (
              <tr key={q.questionId}>
                <td className={CELL}>
                  <CategoryLabel config={config} categoryId={q.categoryId} />
                </td>
                <th scope="row" className={`${ROW_HEADER} wrap-anywhere`}>
                  {q.title}
                </th>
                <td className={PLAIN_NUMERIC}>{q.scoredCount}</td>
                <td className={PLAIN_NUMERIC}>{formatLastScore(q.last, locale)}</td>
                <td className={PLAIN_NUMERIC}>
                  <RateCell
                    ui={ui}
                    rate={q.meanRate}
                    color={findCategory(config, q.categoryId)?.color}
                  />
                </td>
                <td className={`${CELL} pl-4`}>
                  {q.toReview && (
                    <span className="inline-flex h-6 items-center rounded-sm border border-destructive px-2.5 text-label whitespace-nowrap text-destructive">
                      {text('training_stats_review_title', {})}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </StatsTable>
        </div>
      </details>
    </div>
  )
}
