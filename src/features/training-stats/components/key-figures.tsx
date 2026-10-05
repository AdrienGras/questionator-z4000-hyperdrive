import { useId } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { TrainingStats } from '@/domain/training/training-stats'
import type { Ui } from '@/lib/i18n/use-ui'

const FIGURE = 'text-lg font-semibold tabular-nums'

/** Chiffres clés : réponses notées, passées, couverture des questions (avec sa barre). */
export function KeyFigures({ ui, stats }: Readonly<{ ui: Ui; stats: TrainingStats }>) {
  const { text } = ui
  const headingId = useId()
  const { covered, total } = stats.coverage
  const coverage = text('training_stats_coverage', { covered, total })
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="sr-only">
        {text('training_stats_key_figures', {})}
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className={FIGURE}>{text('training_stats_scored', { count: stats.scoredCount })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className={FIGURE}>{text('training_stats_passed', { count: stats.passedCount })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            {/* La barre porte la couverture dans son nom : le texte visible n'est pas relu. */}
            <p className={FIGURE} aria-hidden>
              {coverage}
            </p>
            <Progress value={total === 0 ? 0 : (covered / total) * 100} aria-label={coverage} />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
