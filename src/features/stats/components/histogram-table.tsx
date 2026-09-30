import type { HistogramBin } from '@/domain/stats/types'
import { binLabel } from '@/domain/stats/labels'
import type { Ui } from '@/lib/i18n/use-ui'
import { NUMERIC_CELL, ROW_HEADER, StatsTable } from './stats-section'

type HistogramTableProps = Readonly<{ ui: Ui; bins: HistogramBin[]; labelledBy: string }>

/** Données du graphique pour les lecteurs d'écran : masquées à l'œil (`sr-only`), lues en tableau. */
export function HistogramTable({ ui, bins, labelledBy }: HistogramTableProps) {
  const { text, locale } = ui
  return (
    <div className="sr-only">
      <StatsTable
        labelledBy={labelledBy}
        columns={[
          { label: text('stats_col_range', {}) },
          { label: text('stats_col_students', {}), numeric: true },
        ]}
      >
        {bins.map((bin, index) => (
          <tr key={bin.from}>
            <th scope="row" className={ROW_HEADER}>
              {binLabel(bin, index === bins.length - 1, locale)}
            </th>
            <td className={NUMERIC_CELL}>{bin.count}</td>
          </tr>
        ))}
      </StatsTable>
    </div>
  )
}
