import type { CSSProperties } from 'react'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Strategy } from '@/domain/stats/types'
import { categoryLabel, findCategory } from '@/domain/config/lookup'
import { formatDecimal } from '@/features/stats/format-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import {
  NUMERIC_CELL,
  ROW_HEADER,
  StatsSection,
  StatsTable,
} from '@/components/stats/stats-section'
import { StatsEmpty } from '@/components/stats/stats-empty'
import { DETAIL_CARD } from './question-tables'

type StrategyTableProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  strategies: Strategy[]
}>

/** Clé stable d'une composition (déjà triée par le domaine). */
const compositionKey = (strategy: Strategy) =>
  strategy.composition.map((c) => `${c.categoryId}×${c.count}`).join('+')

/** Combinaisons de catégories des terminés : pastilles teintées « Facile ×2 », effectif, moyenne. */
export function StrategyTable({ ui, config, strategies }: StrategyTableProps) {
  const { text, locale } = ui
  return (
    <StatsSection title={text('stats_strategies', {})} as="h3" className={DETAIL_CARD}>
      {(headingId) =>
        strategies.length === 0 ? (
          <StatsEmpty>{text('stats_strategies_empty', {})}</StatsEmpty>
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
              const pills = strategy.composition.map(({ categoryId, count }) => {
                const color = findCategory(config, categoryId)?.color
                const style: (CSSProperties & Record<'--category-color', string>) | undefined =
                  color === undefined ? undefined : { '--category-color': color }
                return {
                  categoryId,
                  style,
                  label: text('stats_times', { label: categoryLabel(config, categoryId), count }),
                }
              })
              return (
                <tr key={compositionKey(strategy)}>
                  {/* Nom accessible explicite : les pastilles sont des éléments flex, le texte collé
                      donnerait « A ×2B ×1 ». */}
                  <th
                    scope="row"
                    className={ROW_HEADER}
                    aria-label={pills.map((pill) => pill.label).join(', ')}
                  >
                    <span className="flex flex-wrap gap-1.5">
                      {pills.map(({ categoryId, style, label }) => (
                        <span
                          key={categoryId}
                          style={style}
                          className="inline-flex h-6 items-center rounded-sm bg-[color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_14%,transparent)] px-2.5 text-label whitespace-nowrap text-[var(--category-color,var(--color-muted-foreground))]"
                        >
                          {label}
                        </span>
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
