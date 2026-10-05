import {
  NUMERIC_CELL,
  ROW_HEADER,
  StatsSection,
  StatsTable,
} from '@/components/stats/stats-section'
import type { TrainingStats } from '@/domain/training/training-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { RateCell } from './rate-cell'

type CategoryRatesProps = Readonly<{ ui: Ui; categories: TrainingStats['byCategory'] }>

/** Par niveau, dans l'ordre de la config : taux de réussite et questions notées sur le total. */
export function CategoryRates({ ui, categories }: CategoryRatesProps) {
  const { text } = ui
  return (
    <StatsSection title={text('training_stats_by_category', {})}>
      {(headingId) => (
        <StatsTable
          labelledBy={headingId}
          columns={[
            { label: text('training_stats_col_level', {}) },
            { label: text('training_stats_col_rate', {}), numeric: true },
            { label: text('training_stats_col_coverage', {}), numeric: true },
          ]}
        >
          {categories.map(({ categoryId, label, rate, covered, total }) => (
            <tr key={categoryId} className="border-b last:border-0">
              <th scope="row" className={ROW_HEADER}>
                {label}
              </th>
              <td className={NUMERIC_CELL}>
                <RateCell ui={ui} label={label} rate={rate.rate} />
              </td>
              <td className={NUMERIC_CELL}>{`${covered} / ${total}`}</td>
            </tr>
          ))}
        </StatsTable>
      )}
    </StatsSection>
  )
}
