import { IconPlus } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { DbStatusBanner } from '@/components/db-status-banner'
import { PageShell } from '@/components/page-shell'
import { SpaceIcon } from '@/components/space-icon'
import { buttonVariants } from '@/components/ui/button'
import { useDbStatus, useTrainings } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { TrainingList } from '@/features/trainings/components/training-list'
import { TrainingsEmpty } from '@/features/trainings/components/trainings-empty'

/** Page de l'espace Entraînement (artboard `trainings`, #147) : nouvel entraînement, puis la liste. */
export function TrainingsPage() {
  const ui = useUi()
  const { text } = ui
  const status = useDbStatus()
  const trainings = useTrainings()
  return (
    <PageShell
      title={text('menu_training', {})}
      icon={<SpaceIcon space="training" size="lg" />}
      meta={text('trainings_subtitle', {})}
      halo="space"
      actions={
        status === 'unavailable' ? undefined : (
          <Link to="/training/new" className={buttonVariants()}>
            <IconPlus aria-hidden />
            {text('trainings_new', {})}
          </Link>
        )
      }
    >
      <section aria-labelledby="trainings-list-title" className="flex flex-col gap-3">
        <h2 id="trainings-list-title" className="sr-only">
          {text('home_trainings_title', {})}
        </h2>
        {status !== 'open' && <DbStatusBanner ui={ui} status={status} />}
        {status === 'open' && trainings?.length === 0 && <TrainingsEmpty ui={ui} />}
        {status === 'open' && trainings !== undefined && trainings.length > 0 && (
          <TrainingList ui={ui} trainings={trainings} />
        )}
      </section>
    </PageShell>
  )
}
