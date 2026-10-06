import {
  NUMERIC_CELL,
  ROW_HEADER,
  StatsSection,
  StatsTable,
} from '@/components/stats/stats-section'
import type { TrainingStats } from '@/domain/training/training-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { RateCell } from './rate-cell'

/** Par notion (tag), dans l'ordre des stats : taux de réussite. */
export function TagRates({ ui, tags }: Readonly<{ ui: Ui; tags: TrainingStats['byTag'] }>) {
  const { text } = ui
  return (
    <StatsSection title={text('training_stats_by_tag', {})}>
      {(headingId) => (
        <StatsTable
          labelledBy={headingId}
          columns={[
            { label: text('training_stats_col_tag', {}) },
            { label: text('training_stats_col_rate', {}), numeric: true },
          ]}
        >
          {tags.map(({ tag, rate }) => (
            <tr key={tag} className="border-b last:border-0">
              <th scope="row" className={ROW_HEADER}>
                {tag}
              </th>
              <td className={NUMERIC_CELL}>
                <RateCell ui={ui} label={tag} rate={rate.rate} />
              </td>
            </tr>
          ))}
        </StatsTable>
      )}
    </StatsSection>
  )
}
