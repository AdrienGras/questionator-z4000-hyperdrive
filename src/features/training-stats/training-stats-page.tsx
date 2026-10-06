import { getRouteApi, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { PageShell } from '@/components/page-shell'
import { SMALL_TEXT_LINK_CLASS, TEXT_LINK_CLASS } from '@/components/text-link'
import { TrainingGate } from '@/components/training-gate'
import { Card, CardContent } from '@/components/ui/card'
import { computeTrainingStats } from '@/domain/training/training-stats'
import type { Training, TrainingDraw } from '@/domain/training/types'
import { useUi } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import { CategoryRates } from '@/features/training-stats/components/category-rates'
import { KeyFigures } from '@/features/training-stats/components/key-figures'
import { QuestionDetails } from '@/features/training-stats/components/question-details'
import { ReviewList } from '@/features/training-stats/components/review-list'
import { TagRates } from '@/features/training-stats/components/tag-rates'

const route = getRouteApi('/training/$trainingId_/stats')

/**
 * Corps de l'écran, sous l'apparence de la config : chiffres clés, « À revoir », taux par niveau
 * et par notion côte à côte, puis le détail replié. Journal vide : une carte d'invitation seule.
 */
function TrainingStatsView({
  training,
  draws,
}: Readonly<{ training: Training; draws: TrainingDraw[] }>) {
  const ui = useUi()
  const { text } = ui
  const { config } = training
  const stats = useMemo(() => computeTrainingStats(config, draws), [config, draws])
  const levels = useMemo(
    () => new Map(stats.byCategory.map((c) => [c.categoryId, c.label])),
    [stats],
  )
  const params = { trainingId: training.id }
  const empty = stats.scoredCount === 0 && stats.passedCount === 0
  return (
    <PageShell
      ui={ui}
      title={training.name}
      back={
        <Link
          to="/training/$trainingId"
          params={params}
          className={cn('self-start', SMALL_TEXT_LINK_CLASS)}
        >
          {text('training_stats_back', {})}
        </Link>
      }
    >
      {empty ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <p>{text('training_stats_empty', {})}</p>
            <Link to="/training/$trainingId" params={params} className={TEXT_LINK_CLASS}>
              {text('training_stats_start', {})}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <KeyFigures ui={ui} stats={stats} />
          <ReviewList ui={ui} questions={stats.questions} levels={levels} />
          <div className="grid gap-4 md:grid-cols-2">
            <CategoryRates ui={ui} categories={stats.byCategory} />
            {stats.byTag.length > 0 && <TagRates ui={ui} tags={stats.byTag} />}
          </div>
          <QuestionDetails ui={ui} questions={stats.questions} levels={levels} />
        </div>
      )}
    </PageShell>
  )
}

/** Stats d'un entraînement (F43.4) : états communs de `TrainingGate`, puis la vue. */
export function TrainingStatsPage() {
  const { trainingId } = route.useParams()
  return (
    <TrainingGate trainingId={trainingId}>
      {(training, draws) => <TrainingStatsView training={training} draws={draws} />}
    </TrainingGate>
  )
}
