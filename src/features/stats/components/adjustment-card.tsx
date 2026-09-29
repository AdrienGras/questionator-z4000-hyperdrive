import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import type { AdjustmentStats } from '@/domain/stats/types'
import { formatDecimal } from '@/features/stats/format-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { StatFigures, StatsSection } from './stats-section'

type AdjustmentCardProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  adjustments: AdjustmentStats
}>

/** Ajustements non nuls : nombre, somme signée au format des notes, moyenne à 2 décimales. */
export function AdjustmentCard({ ui, config, adjustments }: AdjustmentCardProps) {
  const { text, locale } = ui
  const sum = formatScore(adjustments.sum, 'final', config, locale)
  return (
    <StatsSection title={text('stats_adjustments', {})}>
      {() => (
        <StatFigures
          items={[
            { label: text('stats_adjustments_count', {}), value: String(adjustments.count) },
            // Signe explicite : Intl n'écrit que le « − » des négatifs.
            {
              label: text('stats_adjustments_sum', {}),
              value: adjustments.sum > 0 ? `+${sum}` : sum,
            },
            {
              label: text('stats_adjustments_mean', {}),
              value: formatDecimal(adjustments.mean, locale),
            },
          ]}
        />
      )}
    </StatsSection>
  )
}
