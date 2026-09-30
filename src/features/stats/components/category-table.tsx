import type { NormalizedConfig } from '@/domain/config/normalize'
import type { CategoryStats } from '@/domain/stats/types'
import { formatRate } from '@/features/stats/format-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { CategoryLabel } from './category-label'
import { NUMERIC_CELL, ROW_HEADER, StatsSection, StatsTable } from './stats-section'

type CategoryTableProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  categories: CategoryStats[]
}>

/** Par catégorie : choix (skips compris), attempts notés et taux de réussite. */
export function CategoryTable({ ui, config, categories }: CategoryTableProps) {
  const { text, locale } = ui
  return (
    <StatsSection title={text('stats_categories', {})}>
      {(headingId) => (
        <StatsTable
          labelledBy={headingId}
          columns={[
            { label: text('stats_col_category', {}) },
            { label: text('stats_col_choices', {}), numeric: true },
            { label: text('stats_col_scored', {}), numeric: true },
            { label: text('stats_col_success_rate', {}), numeric: true },
          ]}
        >
          {categories.map((category) => (
            <tr key={category.categoryId} className="border-b last:border-0">
              <th scope="row" className={ROW_HEADER}>
                <CategoryLabel config={config} categoryId={category.categoryId} />
              </th>
              <td className={NUMERIC_CELL}>{category.choices}</td>
              <td className={NUMERIC_CELL}>{category.scored}</td>
              <td className={NUMERIC_CELL}>{formatRate(category.successRate, locale)}</td>
            </tr>
          ))}
        </StatsTable>
      )}
    </StatsSection>
  )
}
