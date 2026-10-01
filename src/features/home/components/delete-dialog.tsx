import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
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
 * Confirmation de suppression ; « Exporter un backup d'abord » laisse le dialogue ouvert. Pendant
 * l'écriture, ni « Annuler » ni Échap ne ferment le dialogue.
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
  const [deleting, setDeleting] = useState(false)
  const [failed, setFailed] = useState(false)

  function changeOpen(next: boolean) {
    if (deleting) return
    setFailed(false)
    onOpenChange(next)
  }

  async function confirm() {
    if (deleting) return
    setDeleting(true)
    setFailed(false)
    try {
      await deleteSession(sessionId)
      setDeleting(false)
      onOpenChange(false)
    } catch {
      setDeleting(false)
      setFailed(true)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{text('delete_title', { name })}</AlertDialogTitle>
          <AlertDialogDescription>{text('delete_body', {})}</AlertDialogDescription>
        </AlertDialogHeader>
        {failed && (
          <p role="alert" className="text-sm text-destructive">
            {text('write_error', {})}
          </p>
        )}
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => exportBackup(backup)}>
            {text('delete_export_first', {})}
          </Button>
          <AlertDialogCancel disabled={deleting}>{text('dialog_cancel', {})}</AlertDialogCancel>
          <Button variant="destructive" disabled={deleting} onClick={() => void confirm()}>
            {text('delete_confirm', {})}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
