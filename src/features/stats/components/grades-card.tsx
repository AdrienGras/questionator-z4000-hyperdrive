import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import type { Milli } from '@/domain/scoring/milli'
import type { AdjustmentStats, GradeStats, HistogramBin } from '@/domain/stats/types'
import { NO_VALUE } from '@/components/stats/format-rate'
import { StatsEmpty } from '@/components/stats/stats-empty'
import { StatsSection } from '@/components/stats/stats-section'
import { formatDecimal } from '@/features/stats/format-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { HistogramBars } from './histogram-bars'

type GradesCardProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  grades: GradeStats
  histogram: HistogramBin[]
  adjustments: AdjustmentStats
}>

/**
 * « Notes finales » (artboard `statistiques`) : histogramme et chiffres des terminés, ajustements en
 * pied. Min, max et somme au format des notes ; écart-type et moyenne d'ajustement à 2 décimales.
 */
export function GradesCard({ ui, config, grades, histogram, adjustments }: GradesCardProps) {
  const { text, locale } = ui
  const score = (value: Milli | null) =>
    value === null ? NO_VALUE : formatScore(value, 'final', config, locale)
  const sum = formatScore(adjustments.sum, 'final', config, locale)
  const figures = [
    { label: text('stats_grades_count', {}), value: String(grades.count) },
    { label: text('stats_grades_min', {}), value: score(grades.min) },
    { label: text('stats_grades_max', {}), value: score(grades.max) },
    { label: text('stats_grades_std_dev', {}), value: formatDecimal(grades.stdDev, locale) },
  ]
  const strong = 'font-bold text-foreground tabular-nums'
  return (
    <StatsSection
      title={text('stats_grades', {})}
      as="h3"
      size="h2"
      className="min-w-0 flex-[3_1_28.75rem]"
    >
      {() => (
        <>
          <div className="flex flex-wrap items-end gap-6">
            {grades.count === 0 ? (
              <div className="flex-[3_1_18.75rem]">
                <StatsEmpty>{text('stats_histogram_empty', {})}</StatsEmpty>
              </div>
            ) : (
              <HistogramBars
                ui={ui}
                bins={histogram}
                finalScale={config.scoring.finalScale}
                count={grades.count}
              />
            )}
            <dl className="flex flex-[1_1_10rem] flex-col">
              {figures.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-3 border-t py-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-auto border-t pt-3 text-small text-muted-foreground">
            {text('stats_adjustments', {})} <b className={strong}>{adjustments.count}</b>
            {' · '}
            {text('stats_adjustments_sum', {})}{' '}
            {/* Signe explicite : Intl n'écrit que le « − » des négatifs. */}
            <b className={strong}>{adjustments.sum > 0 ? `+${sum}` : sum}</b>
            {' · '}
            {text('stats_adjustments_mean', {})}{' '}
            <b className={strong}>{formatDecimal(adjustments.mean, locale)}</b>
          </p>
        </>
      )}
    </StatsSection>
  )
}
