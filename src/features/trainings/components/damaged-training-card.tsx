import { IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { CardActionsMenu } from '@/components/card-actions-menu'
import { DamagedBadge } from '@/components/damaged-badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { damagedTrainingName, type DamagedTraining } from '@/lib/db/damaged-training'
import type { Ui } from '@/lib/i18n/use-ui'
import { DeleteTrainingDialog } from './delete-training-dialog'

type DamagedTrainingCardProps = Readonly<{ ui: Ui; damaged: DamagedTraining }>

/** Carte d'un entraînement illisible : ni reprise ni couverture, seulement la suppression (bouton et menu). */
export function DamagedTrainingCard({ ui, damaged }: DamagedTrainingCardProps) {
  const { text } = ui
  const [deleting, setDeleting] = useState(false)
  const name = damagedTrainingName(damaged)

  return (
    <Card className="w-full gap-4">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold wrap-anywhere">{name}</h3>
          <DamagedBadge ui={ui} />
        </CardTitle>
        <CardAction>
          <CardActionsMenu label={text('card_actions', { name })}>
            <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
              {text('action_delete', {})}
            </DropdownMenuItem>
          </CardActionsMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-muted-foreground">{text('home_training_damaged_body', {})}</p>
        {/* L'action utile sort du menu « … » en bouton visible (D103). */}
        <div className="mt-auto">
          <Button variant="outline" size="sm" onClick={() => setDeleting(true)}>
            <IconTrash aria-hidden />
            {text('action_delete', {})}
          </Button>
        </div>
      </CardContent>
      <DeleteTrainingDialog
        ui={ui}
        trainingId={damaged.id}
        name={name}
        open={deleting}
        onOpenChange={setDeleting}
      />
    </Card>
  )
}
