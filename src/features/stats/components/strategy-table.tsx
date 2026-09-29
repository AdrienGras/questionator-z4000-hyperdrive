import { Fragment } from 'react'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Strategy } from '@/domain/stats/types'
import { categoryLabel } from '@/features/stats/config-lookup'
import { formatDecimal } from '@/features/stats/format-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { NUMERIC_CELL, ROW_HEADER, StatsSection, StatsTable } from './stats-section'

type StrategyTableProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  strategies: Strategy[]
}>

/** Clé stable d'une composition (déjà triée par le domaine). */
const compositionKey = (strategy: Strategy) =>
  strategy.composition.map((c) => `${c.categoryId}×${c.count}`).join('+')

/** Combinaisons de catégories des terminés : pastilles « Facile ×2 · Difficile ×1 », effectif, moyenne. */
export function StrategyTable({ ui, config, strategies }: StrategyTableProps) {
  const { text, locale } = ui
  return (
    <StatsSection title={text('stats_strategies', {})}>
      {(headingId) =>
        strategies.length === 0 ? (
          <p className="text-muted-foreground">{text('stats_strategies_empty', {})}</p>
        ) : (
          <StatsTable
            labelledBy={headingId}
            columns={[
              { label: text('stats_col_composition', {}) },
              { label: text('stats_col_students', {}), numeric: true },
              { label: text('stats_col_mean_final', {}), numeric: true },
            ]}
          >
            {strategies.map((strategy) => {
              const pills = strategy.composition.map(({ categoryId, count }) => ({
                categoryId,
                label: text('stats_times', { label: categoryLabel(config, categoryId), count }),
              }))
              return (
                <tr key={compositionKey(strategy)} className="border-b last:border-0">
                  {/* Nom accessible explicite : les pastilles sont des éléments flex, le texte collé
                      donnerait « A ×2B ×1 » (le « · » visuel est masqué, un espace sr-only serait rogné). */}
                  <th
                    scope="row"
                    className={ROW_HEADER}
                    aria-label={pills.map((pill) => pill.label).join(', ')}
                  >
                    <span className="flex flex-wrap items-center gap-1">
                      {pills.map(({ categoryId, label }, index) => (
                        <Fragment key={categoryId}>
                          {index > 0 && <span aria-hidden> · </span>}
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{label}</span>
                        </Fragment>
                      ))}
                    </span>
                  </th>
                  <td className={NUMERIC_CELL}>{strategy.students}</td>
                  <td className={NUMERIC_CELL}>{formatDecimal(strategy.meanFinal, locale)}</td>
                </tr>
              )
            })}
          </StatsTable>
        )
      }
    </StatsSection>
  )
}
