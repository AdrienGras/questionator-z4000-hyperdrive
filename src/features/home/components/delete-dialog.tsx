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
import type { Session } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { exportSession } from '@/features/home/export-session'

type DeleteDialogProps = Readonly<{
  ui: Ui
  session: Session
  open: boolean
  onOpenChange: (open: boolean) => void
}>

/** Confirmation de suppression ; « Exporter un backup d'abord » laisse le dialogue ouvert. */
export function DeleteDialog({ ui, session, open, onOpenChange }: DeleteDialogProps) {
  const { text } = ui
  const [deleting, setDeleting] = useState(false)
  const [failed, setFailed] = useState(false)

  function changeOpen(next: boolean) {
    setFailed(false)
    onOpenChange(next)
  }

  async function confirm() {
    setDeleting(true)
    setFailed(false)
    try {
      await deleteSession(session.id)
      onOpenChange(false)
    } catch {
      setFailed(true)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{text('delete_title', { name: session.name })}</AlertDialogTitle>
          <AlertDialogDescription>{text('delete_body', {})}</AlertDialogDescription>
        </AlertDialogHeader>
        {failed && (
          <p role="alert" className="text-sm text-destructive">
            {text('write_error', {})}
          </p>
        )}
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => exportSession(session)}>
            {text('delete_export_first', {})}
          </Button>
          <AlertDialogCancel>{text('dialog_cancel', {})}</AlertDialogCancel>
          <Button variant="destructive" disabled={deleting} onClick={() => void confirm()}>
            {text('delete_confirm', {})}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
