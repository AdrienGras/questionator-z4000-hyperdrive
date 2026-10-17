import { MeterBar } from '@/components/stats/meter-bar'
import { StatsSection } from '@/components/stats/stats-section'
import type { TrainingStats } from '@/domain/training/training-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { formatPercent } from './rate-cell'

/** Par notion (tag), dans l'ordre des stats : nom, taux et sa barre. */
export function TagRates({ ui, tags }: Readonly<{ ui: Ui; tags: TrainingStats['byTag'] }>) {
  const { text, locale } = ui
  return (
    <StatsSection title={text('training_stats_by_tag', {})} className="min-w-0 flex-[2_1_18.75rem]">
      {() => (
        <ul className="flex flex-col gap-4.5">
          {tags.map(({ tag, rate }) => (
            <li key={tag} className="flex flex-col gap-2">
              <span className="flex justify-between gap-3">
                <span className="font-medium wrap-anywhere">{tag}</span>
                <b className="tabular-nums">{formatPercent(rate.rate, locale)}</b>
              </span>
              <MeterBar value={rate.rate} tone="primary" className="h-2 w-full" />
            </li>
          ))}
        </ul>
      )}
    </StatsSection>
  )
}
