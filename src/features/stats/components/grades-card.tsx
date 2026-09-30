import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import type { Milli } from '@/domain/scoring/milli'
import type { GradeStats } from '@/domain/stats/types'
import { formatDecimal, NO_VALUE } from '@/features/stats/format-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { StatFigures, StatsSection } from './stats-section'

type GradesCardProps = Readonly<{ ui: Ui; config: NormalizedConfig; grades: GradeStats }>

/** Notes finales des terminés : min/max au format des notes, agrégats à 2 décimales. */
export function GradesCard({ ui, config, grades }: GradesCardProps) {
  const { text, locale } = ui
  const score = (value: Milli | null) =>
    value === null ? NO_VALUE : formatScore(value, 'final', config, locale)
  return (
    <StatsSection title={text('stats_grades', {})}>
      {() => (
        <StatFigures
          items={[
            { label: text('stats_grades_count', {}), value: String(grades.count) },
            { label: text('stats_grades_min', {}), value: score(grades.min) },
            { label: text('stats_grades_max', {}), value: score(grades.max) },
            { label: text('stats_grades_mean', {}), value: formatDecimal(grades.mean, locale) },
            { label: text('stats_grades_median', {}), value: formatDecimal(grades.median, locale) },
            {
              label: text('stats_grades_std_dev', {}),
              value: formatDecimal(grades.stdDev, locale),
            },
          ]}
        />
      )}
    </StatsSection>
  )
}
