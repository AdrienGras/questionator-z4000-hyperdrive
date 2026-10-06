import type { TagStats } from '@/domain/stats/types'
import { formatRate } from '@/components/stats/format-rate'
import type { Ui } from '@/lib/i18n/use-ui'
import {
  NUMERIC_CELL,
  ROW_HEADER,
  StatsSection,
  StatsTable,
} from '@/components/stats/stats-section'
import { StatsEmpty } from '@/components/stats/stats-empty'

/** Par tag : attempts notés et taux de réussite ; phrase dédiée si la config n'a aucun tag. */
export function TagTable({ ui, tags }: Readonly<{ ui: Ui; tags: TagStats[] }>) {
  const { text, locale } = ui
  return (
    <StatsSection title={text('stats_tags', {})}>
      {(headingId) =>
        tags.length === 0 ? (
          <StatsEmpty>{text('stats_tags_empty', {})}</StatsEmpty>
        ) : (
          <StatsTable
            labelledBy={headingId}
            columns={[
              { label: text('stats_col_tag', {}) },
              { label: text('stats_col_scored', {}), numeric: true },
              { label: text('stats_col_success_rate', {}), numeric: true },
            ]}
          >
            {tags.map((tag) => (
              <tr key={tag.tag} className="border-b last:border-0">
                <th scope="row" className={ROW_HEADER}>
                  {tag.tag}
                </th>
                <td className={NUMERIC_CELL}>{tag.scored}</td>
                <td className={NUMERIC_CELL}>{formatRate(tag.successRate, locale)}</td>
              </tr>
            ))}
          </StatsTable>
        )
      }
    </StatsSection>
  )
}
