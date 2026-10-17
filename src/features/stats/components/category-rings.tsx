import { findCategory } from '@/domain/config/lookup'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { CategoryStats } from '@/domain/stats/types'
import { CategoryLabel } from '@/components/stats/category-label'
import { formatRate } from '@/components/stats/format-rate'
import { RateRing } from '@/components/stats/rate-ring'
import { StatsSection } from '@/components/stats/stats-section'
import type { Ui } from '@/lib/i18n/use-ui'

type CategoryRingsProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  categories: CategoryStats[]
}>

/** Réussite par catégorie en anneaux (artboard `statistiques`) : taux, notées et choix (skips compris). */
export function CategoryRings({ ui, config, categories }: CategoryRingsProps) {
  const { text, locale } = ui
  return (
    <StatsSection
      title={text('stats_categories', {})}
      as="h3"
      size="h2"
      className="min-w-0 flex-[2_1_20rem]"
    >
      {() => (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
          {categories.map(({ categoryId, choices, scored, successRate }) => {
            const category = findCategory(config, categoryId)
            const rate = formatRate(successRate, locale)
            return (
              <li key={categoryId} className="flex flex-col items-center gap-2 text-center">
                <RateRing
                  rate={successRate}
                  value={rate}
                  label={text('rate_ring_label', { label: category?.label ?? categoryId, rate })}
                  caption={text('rate_ring_caption', {})}
                  color={category?.color}
                  size="lg"
                />
                <span className="flex flex-col items-center gap-0.5">
                  <CategoryLabel config={config} categoryId={categoryId} />
                  <span className="text-label font-normal text-muted-foreground tabular-nums">
                    {text('stats_category_counts', { scored, choices })}
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
