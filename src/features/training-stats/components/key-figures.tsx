import type { ReactNode } from 'react'
import { MeterBar } from '@/components/stats/meter-bar'
import { StatsGroup } from '@/components/stats/stats-section'
import type { TrainingStats } from '@/domain/training/training-stats'
import type { Ui } from '@/lib/i18n/use-ui'

/** Carte d'un chiffre clé : le chiffre, puis son libellé sur la ligne suivante (lus d'un trait). */
function Figure({
  value,
  label,
  children,
}: Readonly<{ value: ReactNode; label: string; children?: ReactNode }>) {
  return (
    <div className="flex flex-[1_1_12.5rem] flex-col gap-2 rounded-lg bg-card px-6 py-5 shadow-card">
      <p className="flex flex-col gap-2">
        <span className="text-score-md tabular-nums">{value}</span>{' '}
        <span className="text-muted-foreground">{label}</span>
      </p>
      {children}
    </div>
  )
}

/** Chiffres clés (artboard `entrainement-stats`) : réponses notées, passées, couverture et sa barre. */
export function KeyFigures({ ui, stats }: Readonly<{ ui: Ui; stats: TrainingStats }>) {
  const { text } = ui
  const { covered, total } = stats.coverage
  return (
    <StatsGroup title={text('training_stats_key_figures', {})}>
      <div className="flex flex-wrap gap-4">
        <Figure
          value={stats.scoredCount}
          label={text('training_stats_scored_label', { count: stats.scoredCount })}
        />
        <Figure
          value={stats.passedCount}
          label={text('training_stats_passed_label', { count: stats.passedCount })}
        />
        <Figure
          value={
            <>
              {covered}
              <span className="text-lg text-muted-foreground">{` / ${total}`}</span>
            </>
          }
          label={text('training_coverage_label', {})}
        >
          <MeterBar
            value={total === 0 ? null : covered / total}
            tone="primary"
            gradient
            className="h-2 w-full"
          />
        </Figure>
      </div>
    </StatsGroup>
  )
}
