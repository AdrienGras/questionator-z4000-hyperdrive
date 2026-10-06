import { useId } from 'react'
import { CELL, NUMERIC_CELL, ROW_HEADER, StatsTable } from '@/components/stats/stats-section'
import { Card, CardContent } from '@/components/ui/card'
import type { QuestionStats } from '@/domain/training/training-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { formatLastScore } from './format-last-score'
import { RateCell } from './rate-cell'

type QuestionDetailsProps = Readonly<{
  ui: Ui
  questions: QuestionStats[]
  /** Libellé du niveau par id de catégorie. */
  levels: ReadonlyMap<string, string>
}>

/** Détail de toutes les questions, replié par défaut (`<details>` natif) ; « à revoir » en tête. */
export function QuestionDetails({ ui, questions, levels }: QuestionDetailsProps) {
  const { text, locale } = ui
  const summaryId = useId()
  return (
    <Card>
      <CardContent>
        <details>
          <summary id={summaryId} className="cursor-pointer font-medium">
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
                <tr key={q.questionId} className="border-b last:border-0">
                  <td className={CELL}>{levels.get(q.categoryId) ?? q.categoryId}</td>
                  <th scope="row" className={`${ROW_HEADER} wrap-anywhere`}>
                    {q.title}
                  </th>
                  <td className={NUMERIC_CELL}>{q.scoredCount}</td>
                  <td className={NUMERIC_CELL}>{formatLastScore(q.last, locale)}</td>
                  <td className={NUMERIC_CELL}>
                    <RateCell ui={ui} label={q.title} rate={q.meanRate} />
                  </td>
                  <td className={CELL}>
                    {q.toReview && (
                      <span className="font-medium text-destructive">
                        {text('training_stats_review_title', {})}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </StatsTable>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
