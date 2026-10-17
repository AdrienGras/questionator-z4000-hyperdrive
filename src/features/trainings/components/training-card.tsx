import { IconChartBar } from '@tabler/icons-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { CardActionsMenu } from '@/components/card-actions-menu'
import { TrainingFigures } from '@/components/training-figures'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import type { Training } from '@/domain/training/types'
import { useTrainingSummary } from '@/hooks/use-training-summary'
import { formatDateTime } from '@/lib/format-date'
import type { Ui } from '@/lib/i18n/use-ui'
import { DeleteTrainingDialog } from './delete-training-dialog'

type TrainingCardProps = Readonly<{ ui: Ui; training: Training }>

/** Carte d'un entraînement : dernière activité, taux et couverture (une fois le journal lu), reprise. */
export function TrainingCard({ ui, training }: TrainingCardProps) {
  const { locale, text } = ui
  const [deleting, setDeleting] = useState(false)
  const summary = useTrainingSummary(training)
  const navigate = useNavigate()
  const params = { trainingId: training.id }

  return (
    <Card className="w-full gap-4">
      <CardHeader>
        <CardTitle>
          {/* `wrap-anywhere` : un nom sans espace coupe au lieu de déborder de la carte (#118). */}
          <h3 className="text-lg font-semibold wrap-anywhere">{training.name}</h3>
        </CardTitle>
        <CardDescription className="text-[13px] leading-[18px]">
          {text('home_training_updated', { date: formatDateTime(training.updatedAt, locale) })}
        </CardDescription>
        <CardAction>
          <CardActionsMenu label={text('card_actions', { name: training.name })}>
            <DropdownMenuItem
              onClick={() => void navigate({ to: '/training/$trainingId/update', params })}
            >
              {text('training_update_link', {})}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
              {text('action_delete', {})}
            </DropdownMenuItem>
          </CardActionsMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {summary !== undefined && <TrainingFigures ui={ui} summary={summary} showCoverage />}
        <div className="mt-auto flex flex-wrap gap-1">
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
        </div>
      </CardContent>
      <DeleteTrainingDialog
        ui={ui}
        trainingId={training.id}
        name={training.name}
        open={deleting}
        onOpenChange={setDeleting}
      />
    </Card>
  )
}
