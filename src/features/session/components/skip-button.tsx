import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Ui } from '@/lib/i18n/use-ui'
import { SkipDialog } from './skip-dialog'

type SkipButtonProps = Readonly<{
  ui: Ui
  skips: NormalizedConfig['skips']
  remaining: number
  disabled: boolean
  onSkip: (reason: string | undefined) => void
}>

/**
 * « Passer la question » (F10), absent si `skips.enabled` est faux. Quota atteint : même motif
 * que la catégorie épuisée de `CategoryGrid` — `aria-disabled` et non `disabled`, sinon
 * l'infobulle ne s'ouvre jamais (D06, QUIRKS), clic neutralisé, motif en `aria-describedby`.
 */
export function SkipButton({ ui, skips, remaining, disabled, onSkip }: SkipButtonProps) {
  const { text } = ui
  const reasonId = useId()
  const [open, setOpen] = useState(false)

  if (!skips.enabled) return null

  const label = text('passage_skip_button', { remaining })

  if (remaining === 0) {
    return (
      <div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                aria-disabled="true"
                aria-describedby={reasonId}
                className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
              />
            }
          >
            {label}
          </TooltipTrigger>
          <TooltipContent>{text('passage_skip_quota_reached', {})}</TooltipContent>
        </Tooltip>
        <span id={reasonId} className="sr-only">
          {text('passage_skip_quota_reached', {})}
        </span>
      </div>
    )
  }

  return (
    <div>
      <Button type="button" variant="outline" disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <SkipDialog ui={ui} skips={skips} open={open} onOpenChange={setOpen} onConfirm={onSkip} />
    </div>
  )
}
