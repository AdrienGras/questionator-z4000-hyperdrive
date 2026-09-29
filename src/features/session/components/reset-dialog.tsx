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
import type { Ui } from '@/lib/i18n/use-ui'

type ResetDialogProps = Readonly<{
  ui: Ui
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}>

/** Confirmation de réinitialisation d'un étudiant (F11) ; en cas d'échec, le dialogue reste ouvert. */
export function ResetDialog({ ui, studentName, open, onOpenChange, onConfirm }: ResetDialogProps) {
  const { text } = ui
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  function changeOpen(next: boolean) {
    setFailed(false)
    onOpenChange(next)
  }

  async function confirm() {
    if (pending) return
    setPending(true)
    setFailed(false)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{text('reset_title', { name: studentName })}</AlertDialogTitle>
          <AlertDialogDescription>{text('reset_body', {})}</AlertDialogDescription>
        </AlertDialogHeader>
        {failed && (
          <p role="alert" className="text-sm text-destructive">
            {text('write_error', {})}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{text('dialog_cancel', {})}</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={() => void confirm()}>
            {text('reset_confirm', {})}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
