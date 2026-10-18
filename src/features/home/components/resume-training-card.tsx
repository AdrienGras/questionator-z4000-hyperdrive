import { IconChartBar } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { TrainingFigures } from '@/components/training-figures'
import { buttonVariants } from '@/components/ui/button'
import type { Training } from '@/domain/training/types'
import { useTrainingSummary } from '@/hooks/use-training-summary'
import { formatShortDateTime } from '@/lib/format-date'
import type { Ui } from '@/lib/i18n/use-ui'
import { ResumeCard } from './resume-card'

/**
 * Entraînement dans « Reprendre » : taux et couverture une fois le journal lu, mêmes chiffres que la
 * carte de la page Entraînement, puis reprise et stats.
 */
export function ResumeTrainingCard({ ui, training }: Readonly<{ ui: Ui; training: Training }>) {
  const { locale, text } = ui
  const summary = useTrainingSummary(training)
  const params = { trainingId: training.id }
  return (
    <ResumeCard
      space="training"
      kind={text('home_kind_training', {})}
      date={formatShortDateTime(training.updatedAt, locale)}
      title={training.name}
      actions={
        <>
          <Link
            to="/training/$trainingId"
            params={params}
            aria-label={text('card_resume_named', { name: training.name })}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {text('card_resume', {})}
          </Link>
          <Link
            to="/training/$trainingId/stats"
            params={params}
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            <IconChartBar aria-hidden />
            {text('training_stats_card_link', {})}
          </Link>
        </>
      }
    >
      {summary !== undefined && <TrainingFigures ui={ui} summary={summary} showCoverage />}
    </ResumeCard>
  )
}
