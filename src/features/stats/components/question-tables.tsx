import type { NormalizedConfig } from '@/domain/config/normalize'
import type { DrawnQuestion, SkippedQuestion } from '@/domain/stats/types'
import { questionTitle } from '@/features/stats/config-lookup'
import type { Ui } from '@/lib/i18n/use-ui'
import { CategoryLabel } from './category-label'
import { CELL, NUMERIC_CELL, ROW_HEADER, StatsSection, StatsTable } from './stats-section'

type QuestionTablesProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  topDrawn: DrawnQuestion[]
  skipped: SkippedQuestion[]
}>

/** « Hors programme ×2, sans motif ×1 » : motifs déjà triés par le domaine, « sans motif » en dernier. */
function reasonsText(reasons: SkippedQuestion['reasons'], ui: Ui): string {
  return reasons
    .map(({ reason, count }) =>
      ui.text('stats_times', { label: reason ?? ui.text('stats_no_reason', {}), count }),
    )
    .join(', ')
}

/** Clé de ligne : une question n'est unique qu'au sein de sa catégorie. */
const rowKey = (q: { categoryId: string; questionId: string }) => `${q.categoryId}/${q.questionId}`

/**
 * Questions les plus tirées et questions passées. Une question absente de la config (backup
 * incohérent) garde sa ligne, sous son id (Review Focus 5).
 */
export function QuestionTables({ ui, config, topDrawn, skipped }: QuestionTablesProps) {
  const { text } = ui
  return (
    <>
      <StatsSection title={text('stats_top_drawn', {})}>
        {(headingId) =>
          topDrawn.length === 0 ? (
            <p className="text-muted-foreground">{text('stats_top_drawn_empty', {})}</p>
          ) : (
            <StatsTable
              labelledBy={headingId}
              columns={[
                { label: text('stats_col_question', {}) },
                { label: text('stats_col_category', {}) },
                { label: text('stats_col_draws', {}), numeric: true },
              ]}
            >
              {topDrawn.map((question) => (
                <tr key={rowKey(question)} className="border-b last:border-0">
                  <th scope="row" className={ROW_HEADER}>
                    {questionTitle(config, question.categoryId, question.questionId)}
                  </th>
                  <td className={CELL}>
                    <CategoryLabel config={config} categoryId={question.categoryId} />
                  </td>
                  <td className={NUMERIC_CELL}>{question.count}</td>
                </tr>
              ))}
            </StatsTable>
          )
        }
      </StatsSection>
      <StatsSection title={text('stats_skipped', {})}>
        {(headingId) =>
          skipped.length === 0 ? (
            <p className="text-muted-foreground">{text('stats_skipped_empty', {})}</p>
          ) : (
            <StatsTable
              labelledBy={headingId}
              columns={[
                { label: text('stats_col_question', {}) },
                { label: text('stats_col_category', {}) },
                { label: text('stats_col_skips', {}), numeric: true },
                { label: text('stats_col_reasons', {}) },
              ]}
            >
              {skipped.map((question) => (
                <tr key={rowKey(question)} className="border-b last:border-0">
                  <th scope="row" className={ROW_HEADER}>
                    {questionTitle(config, question.categoryId, question.questionId)}
                  </th>
                  <td className={CELL}>
                    <CategoryLabel config={config} categoryId={question.categoryId} />
                  </td>
                  <td className={NUMERIC_CELL}>{question.total}</td>
                  <td className={CELL}>{reasonsText(question.reasons, ui)}</td>
                </tr>
              ))}
            </StatsTable>
          )
        }
      </StatsSection>
    </>
  )
}
