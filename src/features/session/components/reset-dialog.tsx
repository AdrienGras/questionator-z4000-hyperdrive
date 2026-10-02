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
import type { WriteOutcome } from '@/features/session/hooks/use-passage-actions'
import type { Ui } from '@/lib/i18n/use-ui'

type ResetDialogProps = Readonly<{
  ui: Ui
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<WriteOutcome>
}>

/**
 * Confirmation de réinitialisation d'un étudiant (F11). `onConfirm` renvoie l'issue de l'écriture :
 * `written` ferme, `failed` garde le dialogue ouvert avec `write_error`, `ignored` (écartée par le
 * verrou, rien n'est parti) ne ferme ni n'alerte. Pendant l'écriture, ni « Annuler » ni Échap ne
 * ferment le dialogue.
 */
export function ResetDialog({ ui, studentName, open, onOpenChange, onConfirm }: ResetDialogProps) {
  const { text } = ui
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  function changeOpen(next: boolean) {
    if (pending) return
    setFailed(false)
    onOpenChange(next)
  }

  async function confirm() {
    if (pending) return
    setPending(true)
    setFailed(false)
    const outcome = await onConfirm()
    setPending(false)
    if (outcome === 'written') onOpenChange(false)
    else if (outcome === 'failed') setFailed(true)
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
          <AlertDialogCancel disabled={pending}>{text('dialog_cancel', {})}</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={() => void confirm()}>
            {text('reset_confirm', {})}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
