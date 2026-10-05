import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { deleteTraining } from '@/lib/db/trainings'
import type { Ui } from '@/lib/i18n/use-ui'

type DeleteTrainingDialogProps = Readonly<{
  ui: Ui
  trainingId: string
  name: string
  open: boolean
  onOpenChange: (open: boolean) => void
}>

/** Confirmation de suppression d'un entraînement et de son journal ; pas d'export (hors périmètre). */
export function DeleteTrainingDialog({
  ui,
  trainingId,
  name,
  open,
  onOpenChange,
}: DeleteTrainingDialogProps) {
  return (
    <ConfirmDeleteDialog
      ui={ui}
      name={name}
      body={ui.text('home_training_delete_body', {})}
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={() => deleteTraining(trainingId)}
    />
  )
}
