import { useId, useState, type FormEvent } from 'react'
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
import type { Ui } from '@/lib/i18n/use-ui'

type TextFieldDialogProps = Readonly<{
  ui: Ui
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  label: string
  hint?: string
  initialValue: string
  required: boolean
  onSave: (value: string) => Promise<void>
}>

/** Dialogue à un champ texte (nom de session, examinateur) ; valeur trimée avant `onSave`. */
export function TextFieldDialog({ ui, open, onOpenChange, title, ...form }: TextFieldDialogProps) {
  const [saving, setSaving] = useState(false)
  return (
    // Pendant l'écriture, Échap et le clic extérieur sont ignorés, comme « Annuler » (désactivé).
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {form.hint !== undefined && <DialogDescription>{form.hint}</DialogDescription>}
        </DialogHeader>
        {/* Monté à chaque ouverture : la valeur repart de `initialValue`. */}
        <TextFieldForm
          ui={ui}
          saving={saving}
          onSavingChange={setSaving}
          onClose={() => onOpenChange(false)}
          {...form}
        />
      </DialogContent>
    </Dialog>
  )
}

type TextFieldFormProps = Readonly<
  Pick<TextFieldDialogProps, 'ui' | 'label' | 'initialValue' | 'required' | 'onSave'> & {
    saving: boolean
    onSavingChange: (saving: boolean) => void
    onClose: () => void
  }
>

function TextFieldForm({
  ui,
  label,
  initialValue,
  required,
  onSave,
  saving,
  onSavingChange,
  onClose,
}: TextFieldFormProps) {
  const { text } = ui
  const id = useId()
  const [value, setValue] = useState(initialValue)
  const [failed, setFailed] = useState(false)
  const invalid = required && value.trim() === ''

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (invalid || saving) return
    onSavingChange(true)
    setFailed(false)
    try {
      await onSave(value.trim())
      onSavingChange(false)
      onClose()
    } catch {
      setFailed(true)
      onSavingChange(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} value={value} onChange={(event) => setValue(event.target.value)} />
      </div>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {text('write_error', {})}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
          {text('dialog_cancel', {})}
        </Button>
        <Button type="submit" disabled={invalid || saving}>
          {text('dialog_save', {})}
        </Button>
      </DialogFooter>
    </form>
  )
}
