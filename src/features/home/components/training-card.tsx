import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { CardActionsMenu } from '@/components/card-actions-menu'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { computeTrainingStats } from '@/domain/training/training-stats'
import type { Training, TrainingDraw } from '@/domain/training/types'
import { formatDateTime } from '@/lib/format-date'
import { useTrainingDraws } from '@/lib/db/hooks'
import type { Ui } from '@/lib/i18n/use-ui'
import { DeleteTrainingDialog } from './delete-training-dialog'

type TrainingCardProps = Readonly<{ ui: Ui; training: Training }>

/** Part des questions déjà notées au moins une fois, en pourcentage arrondi. */
function coveragePercent(training: Training, draws: readonly TrainingDraw[]) {
  const { covered, total } = computeTrainingStats(training.config, draws).coverage
  return total === 0 ? 0 : Math.round((covered / total) * 100)
}

/** Carte d'un entraînement : dernière activité, couverture (une fois le journal lu), reprise. */
export function TrainingCard({ ui, training }: TrainingCardProps) {
  const { locale, text } = ui
  const [deleting, setDeleting] = useState(false)
  const draws = useTrainingDraws(training.id)
  const navigate = useNavigate()
  const params = { trainingId: training.id }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {/* `wrap-anywhere` : un nom sans espace coupe au lieu de déborder de la carte (#118). */}
          <h3 className="text-lg font-semibold wrap-anywhere">{training.name}</h3>
        </CardTitle>
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
      <CardContent className="flex flex-col gap-2 text-sm">
        <p className="text-muted-foreground">
          {text('home_training_updated', { date: formatDateTime(training.updatedAt, locale) })}
        </p>
        {draws !== undefined && (
          <p>{text('home_training_coverage', { percent: coveragePercent(training, draws) })}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Link
          to="/training/$trainingId"
          params={params}
          className={buttonVariants({ variant: 'outline' })}
        >
          {text('card_resume', {})}
        </Link>
        <Link
          to="/training/$trainingId/stats"
          params={params}
          className={buttonVariants({ variant: 'ghost' })}
        >
          {text('training_stats_card_link', {})}
        </Link>
      </CardFooter>
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
