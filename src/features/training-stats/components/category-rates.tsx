import { CategoryLabel } from '@/components/stats/category-label'
import { RateRing } from '@/components/stats/rate-ring'
import { StatsSection } from '@/components/stats/stats-section'
import { findCategory } from '@/domain/config/lookup'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { TrainingStats } from '@/domain/training/training-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { formatPercent } from './rate-cell'

type CategoryRatesProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  categories: TrainingStats['byCategory']
}>

/** Par niveau, dans l'ordre de la config : anneau de réussite et questions notées sur le total. */
export function CategoryRates({ ui, config, categories }: CategoryRatesProps) {
  const { text, locale } = ui
  return (
    <StatsSection
      title={text('training_stats_by_category', {})}
      className="min-w-0 flex-[3_1_27.5rem]"
    >
      {() => (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(6.875rem,1fr))] gap-x-2 gap-y-4">
          {categories.map(({ categoryId, label, rate, covered, total }) => {
            const value = formatPercent(rate.rate, locale)
            return (
              <li key={categoryId} className="flex flex-col items-center gap-2 text-center">
                <RateRing
                  rate={rate.rate}
                  value={value}
                  label={text('rate_ring_label', { label, rate: value })}
                  caption={text('rate_ring_caption', {})}
                  color={findCategory(config, categoryId)?.color}
                  size="md"
                />
                <span className="flex flex-col items-center gap-0.5">
                  <CategoryLabel config={config} categoryId={categoryId} />
                  <span className="text-label font-normal text-muted-foreground tabular-nums">
                    {text('training_stats_level_coverage', { covered, total })}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </StatsSection>
  )
}
