import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react'
import { IconMinus, IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { MAX_REASON_LENGTH } from '@/domain/passage/reason'
import { isValidAdjustment, parseAdjustmentInput, previewFinal } from '@/domain/scoring/adjustment'
import { formatScore } from '@/domain/scoring/format'
import { asMilli, fromMilli, toMilli } from '@/domain/scoring/milli'
import { stepMilli } from '@/domain/scoring/rounding'
import type { Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

export type AdjustmentMode = 'final' | 'adjust'

type AdjustmentDialogProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  student: Student
  open: boolean
  /** `final` : ouverture automatique de fin de passage, annuler révèle la note (D66). */
  mode: AdjustmentMode
  onSave: (value: number, reason: string | undefined) => Promise<boolean>
  onCancel: () => Promise<boolean>
  onClose: () => void
}>

/**
 * Popup d'ajustement (F11). Enregistrer, ou annuler en fin de passage, écrit en base : succès →
 * `onClose` ; échec → `write_error`, popup ouverte. Échap et clic hors du dialogue passent par
 * `onOpenChange(false)`, donc par le même chemin qu'« Annuler ».
 */
export function AdjustmentDialog({
  ui,
  config,
  student,
  open,
  mode,
  onSave,
  onCancel,
  onClose,
}: AdjustmentDialogProps) {
  const { text } = ui
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)
  // Garde synchrone : un double-clic ne part jamais deux fois en base (Review Focus 1), et le
  // second appel, ignoré par la garde du hook, n'est jamais pris pour un échec.
  const inFlight = useRef(false)
  // Focus initial sur le champ de valeur (sinon Base UI prend le premier tabbable, le bouton « − »).
  const valueRef = useRef<HTMLInputElement>(null)

  // Chaque ouverture repart sans erreur ni écriture en cours (motif « état précédent » de React).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setPending(false)
      setFailed(false)
    }
  }

  // Une écriture réussie laisse `inFlight` levé (la popup se ferme via la liveQuery) : seule une
  // réouverture le rebaisse, sinon Échap ou un clic extérieur relancerait une écriture inutile.
  useEffect(() => {
    if (open) inFlight.current = false
  }, [open])

  async function write(action: () => Promise<boolean>) {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    setFailed(false)
    let succeeded = false
    try {
      succeeded = await action()
    } catch {
      succeeded = false
    }
    if (!succeeded) {
      inFlight.current = false
      setPending(false)
      setFailed(true)
      return
    }
    // Succès : les boutons restent désactivés jusqu'à la fermeture. En fin de passage, la popup
    // reste ouverte tant que `finalRevealedAt` n'est pas remonté par la liveQuery.
    onClose()
  }

  function cancel() {
    if (mode === 'adjust') {
      if (!inFlight.current) onClose()
      return
    }
    void write(onCancel)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) cancel()
      }}
    >
      <DialogContent showCloseButton={false} initialFocus={valueRef}>
        <DialogHeader>
          <DialogTitle>{text('adjust_title', {})}</DialogTitle>
        </DialogHeader>
        {/* Monté à chaque ouverture : la saisie repart de l'ajustement enregistré. */}
        <AdjustmentForm
          valueRef={valueRef}
          ui={ui}
          config={config}
          student={student}
          pending={pending}
          failed={failed}
          onSave={(value, reason) => void write(() => onSave(value, reason))}
          onCancel={cancel}
        />
      </DialogContent>
    </Dialog>
  )
}

type AdjustmentFormProps = Readonly<{
  valueRef: RefObject<HTMLInputElement | null>
  ui: Ui
  config: NormalizedConfig
  student: Student
  pending: boolean
  failed: boolean
  onSave: (value: number, reason: string | undefined) => void
  onCancel: () => void
}>

/** Valeur du champ sans décimales forcées : « 0,5 », « -0,25 ». */
function formatInput(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 3, useGrouping: false }).format(
    value,
  )
}

function AdjustmentForm({
  valueRef,
  ui,
  config,
  student,
  pending,
  failed,
  onSave,
  onCancel,
}: AdjustmentFormProps) {
  const { text, locale } = ui
  const fieldId = useId()
  const errorId = useId()
  const reasonId = useId()
  const [input, setInput] = useState(() => formatInput(student.adjustment?.value ?? 0, locale))
  const [reason, setReason] = useState(student.adjustment?.reason ?? '')

  const parsed = parseAdjustmentInput(input)
  const value = parsed !== null && isValidAdjustment(parsed, config) ? parsed : null
  const fmtFinal = (milli: number) => formatScore(asMilli(milli), 'final', config, locale)
  const fmtRaw = (milli: number) => formatScore(asMilli(milli), 'raw', config, locale)
  const scale = toMilli(config.scoring.finalScale)
  const atMin = value !== null && toMilli(value) <= 0 - scale
  const atMax = value !== null && toMilli(value) >= scale

  function step(direction: 1 | -1) {
    const base = value === null ? 0 : toMilli(value)
    const next = Math.min(scale, Math.max(0 - scale, base + direction * stepMilli(config)))
    setInput(formatInput(fromMilli(asMilli(next)), locale))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (value === null || pending) return
    const trimmed = reason.trim()
    onSave(value, trimmed === '' ? undefined : trimmed)
  }

  let preview: string | undefined
  if (value !== null) {
    const { converted, adjustment, final, clamped } = previewFinal(student, config, value)
    preview = text('adjust_preview', {
      converted: fmtFinal(converted),
      sign: adjustment < 0 ? '−' : '+',
      adjustment: fmtFinal(Math.abs(adjustment)),
      final: fmtFinal(final),
      scale: fmtRaw(scale),
    })
    if (clamped) {
      const bound = converted + adjustment < 0 ? 0 : scale
      preview = `${preview} ${text('adjust_clamped', { bound: fmtRaw(bound) })}`
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId}>{text('adjust_field', {})}</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={text('adjust_decrement', {})}
            disabled={pending || atMin}
            onClick={() => step(-1)}
          >
            <IconMinus />
          </Button>
          <Input
            id={fieldId}
            ref={valueRef}
            inputMode="decimal"
            autoComplete="off"
            value={input}
            aria-invalid={value === null}
            aria-describedby={value === null ? errorId : undefined}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={text('adjust_increment', {})}
            disabled={pending || atMax}
            onClick={() => step(1)}
          >
            <IconPlus />
          </Button>
        </div>
        {value === null && (
          <p id={errorId} className="text-sm text-destructive">
            {text('adjust_invalid', {
              step: fmtRaw(stepMilli(config)),
              max: fmtRaw(scale),
            })}
          </p>
        )}
      </div>
      <p aria-live="polite" className="min-h-5 font-medium tabular-nums">
        {preview}
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor={reasonId}>{text('adjust_reason', {})}</Label>
        <Input
          id={reasonId}
          value={reason}
          maxLength={MAX_REASON_LENGTH}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {text('write_error', {})}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          {text('dialog_cancel', {})}
        </Button>
        <Button type="submit" disabled={value === null || pending}>
          {text('dialog_save', {})}
        </Button>
      </DialogFooter>
    </form>
  )
}
