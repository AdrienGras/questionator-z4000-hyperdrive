import type { NormalizedConfig } from '@/domain/config/normalize'
import type { DrawnQuestion, SkippedQuestion } from '@/domain/stats/types'
import { reasonsLabel } from '@/domain/stats/labels'
import { findCategory, questionTitle } from '@/domain/config/lookup'
import type { Ui } from '@/lib/i18n/use-ui'
import { CategoryLabel } from '@/components/stats/category-label'
import { MeterBar } from '@/components/stats/meter-bar'
import {
  CELL,
  NUMERIC_CELL,
  ROW_HEADER,
  StatsSection,
  StatsTable,
} from '@/components/stats/stats-section'
import { StatsEmpty } from '@/components/stats/stats-empty'

type QuestionTablesProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  topDrawn: DrawnQuestion[]
  skipped: SkippedQuestion[]
}>

/** Clé de ligne : une question n'est unique qu'au sein de sa catégorie. */
const rowKey = (q: { categoryId: string; questionId: string }) => `${q.categoryId}/${q.questionId}`

/** Classe d'une carte du détail : deux par rangée, l'une sous l'autre en étroit. */
export const DETAIL_CARD = 'min-w-0 flex-[1_1_25rem]'

/** En-tête de ligne : titre de la question, sa catégorie dessous (l'espace sépare les deux dans le nom). */
function QuestionHeader({
  config,
  question,
}: Readonly<{ config: NormalizedConfig; question: { categoryId: string; questionId: string } }>) {
  return (
    <th scope="row" className={ROW_HEADER}>
      <span className="flex flex-col gap-0.5">
        <span className="wrap-anywhere">
          {questionTitle(config, question.categoryId, question.questionId)}
        </span>{' '}
        <CategoryLabel config={config} categoryId={question.categoryId} />
      </span>
    </th>
  )
}

/**
 * Questions les plus tirées et questions passées (artboard `statistiques`). Une question absente de
 * la config (backup incohérent) garde sa ligne, sous son id (Review Focus 5).
 */
export function QuestionTables({ ui, config, topDrawn, skipped }: QuestionTablesProps) {
  const { text } = ui
  const top = topDrawn[0]?.count ?? 0
  return (
    <>
      <StatsSection title={text('stats_top_drawn', {})} as="h3" className={DETAIL_CARD}>
        {(headingId) =>
          topDrawn.length === 0 ? (
            <StatsEmpty>{text('stats_top_drawn_empty', {})}</StatsEmpty>
          ) : (
            <StatsTable
              labelledBy={headingId}
              columns={[
                { label: text('stats_col_question', {}) },
                { label: text('stats_col_share', {}), srOnly: true },
                { label: text('stats_col_draws', {}), numeric: true },
              ]}
            >
              {topDrawn.map((question) => (
                <tr key={rowKey(question)}>
                  <QuestionHeader config={config} question={question} />
                  <td className={CELL}>
                    <MeterBar
                      value={question.count / top}
                      tone="category"
                      color={findCategory(config, question.categoryId)?.color}
                      className="w-22"
                    />
                  </td>
                  <td className={NUMERIC_CELL}>{question.count}</td>
                </tr>
              ))}
            </StatsTable>
          )
        }
      </StatsSection>
      <StatsSection title={text('stats_skipped', {})} as="h3" className={DETAIL_CARD}>
        {(headingId) =>
          skipped.length === 0 ? (
            <StatsEmpty>{text('stats_skipped_empty', {})}</StatsEmpty>
          ) : (
            <StatsTable
              labelledBy={headingId}
              columns={[
                { label: text('stats_col_question', {}) },
                { label: text('stats_col_reasons', {}) },
                { label: text('stats_col_skips', {}), numeric: true },
              ]}
            >
              {skipped.map((question) => (
                <tr key={rowKey(question)}>
                  <QuestionHeader config={config} question={question} />
                  <td className={`${CELL} text-small text-muted-foreground`}>
                    {reasonsLabel(question.reasons, text('stats_no_reason', {}), (label, count) =>
                      text('stats_times', { label, count }),
                    )}
                  </td>
                  <td className={NUMERIC_CELL}>{question.total}</td>
                </tr>
              ))}
            </StatsTable>
          )
        }
      </StatsSection>
    </>
  )
}
