import { getRouteApi, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { BackLink } from '@/components/back-link'
import { PageShell } from '@/components/page-shell'
import { StatsEmptyState } from '@/components/stats/stats-empty-state'
import { TrainingGate } from '@/components/training-gate'
import { buttonVariants } from '@/components/ui/button'
import { computeTrainingStats } from '@/domain/training/training-stats'
import type { Training, TrainingDraw } from '@/domain/training/types'
import { useUi } from '@/lib/i18n/use-ui'
import { CategoryRates } from '@/features/training-stats/components/category-rates'
import { KeyFigures } from '@/features/training-stats/components/key-figures'
import { QuestionDetails } from '@/features/training-stats/components/question-details'
import { ReviewList } from '@/features/training-stats/components/review-list'
import { TagRates } from '@/features/training-stats/components/tag-rates'

const route = getRouteApi('/training/$trainingId_/stats')

/**
 * Corps de l'écran (artboard `entrainement-stats`), sous l'apparence de la config : chiffres clés,
 * taux par niveau et par notion côte à côte, « À revoir », puis le détail replié. Journal vide :
 * l'état vide des stats seul.
 */
function TrainingStatsView({
  training,
  draws,
}: Readonly<{ training: Training; draws: TrainingDraw[] }>) {
  const ui = useUi()
  const { text } = ui
  const { config } = training
  const stats = useMemo(() => computeTrainingStats(config, draws), [config, draws])
  const params = { trainingId: training.id }
  const empty = stats.scoredCount === 0 && stats.passedCount === 0
  return (
    <PageShell
      title={training.name}
      meta={text('training_stats_subtitle', {})}
      back={
        <BackLink to="/training/$trainingId" params={params}>
          {text('training_stats_back', {})}
        </BackLink>
      }
    >
      {empty ? (
        <StatsEmptyState
          body={text('training_stats_empty', {})}
          action={
            <Link to="/training/$trainingId" params={params} className={buttonVariants()}>
              {text('training_stats_start', {})}
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <KeyFigures ui={ui} stats={stats} />
          <div className="flex flex-wrap items-stretch gap-4">
            <CategoryRates ui={ui} config={config} categories={stats.byCategory} />
            {stats.byTag.length > 0 && <TagRates ui={ui} tags={stats.byTag} />}
          </div>
          <ReviewList ui={ui} config={config} questions={stats.questions} />
          <QuestionDetails ui={ui} config={config} questions={stats.questions} />
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
