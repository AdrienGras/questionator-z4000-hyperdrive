import type { TagStats } from '@/domain/stats/types'
import { formatRate } from '@/components/stats/format-rate'
import { MeterBar } from '@/components/stats/meter-bar'
import type { Ui } from '@/lib/i18n/use-ui'
import {
  CELL,
  NUMERIC_CELL,
  ROW_HEADER,
  StatsSection,
  StatsTable,
} from '@/components/stats/stats-section'
import { StatsEmpty } from '@/components/stats/stats-empty'
import { DETAIL_CARD } from './question-tables'

/** Par tag, dans l'ordre de la config : notés, barre et taux de réussite ; phrase si aucun tag. */
export function TagTable({ ui, tags }: Readonly<{ ui: Ui; tags: TagStats[] }>) {
  const { text, locale } = ui
  return (
    <StatsSection title={text('stats_tags', {})} as="h3" className={DETAIL_CARD}>
      {(headingId) =>
        tags.length === 0 ? (
          <StatsEmpty>{text('stats_tags_empty', {})}</StatsEmpty>
        ) : (
          <StatsTable
            labelledBy={headingId}
            columns={[
              { label: text('stats_col_tag', {}) },
              { label: text('stats_col_scored', {}), numeric: true },
              { label: text('stats_col_bar', {}), srOnly: true },
              { label: text('stats_col_success_rate', {}), numeric: true },
            ]}
          >
            {tags.map((tag) => (
              <tr key={tag.tag}>
                <th scope="row" className={ROW_HEADER}>
                  {tag.tag}
                </th>
                <td className={`${NUMERIC_CELL} font-normal text-muted-foreground`}>
                  {tag.scored}
                </td>
                <td className={`${CELL} sm:pl-4`}>
                  {tag.successRate !== null && (
                    <MeterBar value={tag.successRate} tone="primary" className="w-10 sm:w-24" />
                  )}
                </td>
                <td className={NUMERIC_CELL}>{formatRate(tag.successRate, locale)}</td>
              </tr>
            ))}
          </StatsTable>
        )
      }
    </StatsSection>
  )
}
