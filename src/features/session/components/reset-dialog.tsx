import type { WriteOutcome } from '@/features/session/hooks/use-passage-actions'
import type { Ui } from '@/lib/i18n/use-ui'
import { ConfirmWriteDialog } from './confirm-write-dialog'

type ResetDialogProps = Readonly<{
  ui: Ui
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<WriteOutcome>
}>

/** Confirmation de réinitialisation d'un étudiant (F11), au motif de `ConfirmWriteDialog`. */
export function ResetDialog({ ui, studentName, open, onOpenChange, onConfirm }: ResetDialogProps) {
  const { text } = ui
  return (
    <ConfirmWriteDialog
      ui={ui}
      title={text('reset_title', { name: studentName })}
      description={text('reset_body', {})}
      confirmLabel={text('reset_confirm', {})}
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  )
}
