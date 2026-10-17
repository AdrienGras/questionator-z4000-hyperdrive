import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { clearSessionCommentDrafts } from '@/lib/comment-draft'
import { deleteSession } from '@/lib/db/sessions'
import type { Ui } from '@/lib/i18n/use-ui'
import { exportBackup } from '@/components/export/export-backup'

type DeleteDialogProps = Readonly<{
  ui: Ui
  sessionId: string
  name: string
  backup: unknown
  open: boolean
  onOpenChange: (open: boolean) => void
}>

/**
 * Confirmation de suppression d'une session ; « Exporter un backup d'abord » laisse le dialogue
 * ouvert. Pendant l'écriture, ni « Annuler » ni Échap ne ferment le dialogue.
 */
export function DeleteDialog({
  ui,
  sessionId,
  name,
  backup,
  open,
  onOpenChange,
}: DeleteDialogProps) {
  const { text } = ui
  return (
    <ConfirmDeleteDialog
      ui={ui}
      name={name}
      body={text('delete_body', {})}
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={async () => {
        await deleteSession(sessionId)
        clearSessionCommentDrafts(sessionId)
      }}
      extraAction={
        <Button variant="outline" onClick={() => exportBackup(backup)}>
          {text('delete_export_first', {})}
        </Button>
      }
    />
  )
}
