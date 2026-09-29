import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { MAX_SKIP_REASON_LENGTH } from '@/domain/passage/skip'
import type { Ui } from '@/lib/i18n/use-ui'

type SkipDialogProps = Readonly<{
  ui: Ui
  skips: NormalizedConfig['skips']
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string | undefined) => void
}>

/** Confirmation du skip (F10), avec motif facultatif : prédéfini ou libre, jamais les deux. */
export function SkipDialog({ ui, skips, open, onOpenChange, onConfirm }: SkipDialogProps) {
  const { text } = ui
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{text('passage_skip_title', {})}</DialogTitle>
          <DialogDescription>{text('passage_skip_body', {})}</DialogDescription>
        </DialogHeader>
        {/* Monté à chaque ouverture : le motif repart de zéro. */}
        <SkipForm
          ui={ui}
          skips={skips}
          onConfirm={(reason) => {
            onOpenChange(false)
            onConfirm(reason)
          }}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type SkipFormProps = Readonly<
  Pick<SkipDialogProps, 'ui' | 'skips' | 'onConfirm'> & { onClose: () => void }
>

function SkipForm({ ui, skips, onConfirm, onClose }: SkipFormProps) {
  const { text } = ui
  const freeTextId = useId()
  const [selectedReason, setSelectedReason] = useState<string | undefined>(undefined)
  const [freeText, setFreeText] = useState('')
  const hasReasons = skips.reasons.length > 0

  function toggleReason(reason: string) {
    setFreeText('')
    setSelectedReason((current) => (current === reason ? undefined : reason))
  }

  function changeFreeText(value: string) {
    setSelectedReason(undefined)
    setFreeText(value)
  }

  function confirm() {
    const reason = selectedReason ?? freeText.trim()
    onConfirm(reason === '' ? undefined : reason)
  }

  return (
    <div className="flex flex-col gap-4">
      {(hasReasons || skips.allowFreeText) && (
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{text('passage_skip_reasons', {})}</legend>
          {hasReasons && (
            <div className="flex flex-wrap gap-2">
              {skips.reasons.map((reason) => (
                <Button
                  key={reason}
                  type="button"
                  variant={selectedReason === reason ? 'default' : 'outline'}
                  aria-pressed={selectedReason === reason}
                  onClick={() => toggleReason(reason)}
                >
                  {reason}
                </Button>
              ))}
            </div>
          )}
          {skips.allowFreeText && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={freeTextId}>{text('passage_skip_free_text', {})}</Label>
              <Input
                id={freeTextId}
                value={freeText}
                maxLength={MAX_SKIP_REASON_LENGTH}
                onChange={(event) => changeFreeText(event.target.value)}
              />
            </div>
          )}
        </fieldset>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {text('dialog_cancel', {})}
        </Button>
        <Button type="button" onClick={confirm}>
          {text('passage_skip_confirm', {})}
        </Button>
      </DialogFooter>
    </div>
  )
}
