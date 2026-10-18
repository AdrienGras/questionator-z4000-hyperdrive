import { IconCircleCheck, IconCircleMinus, IconCirclePlus, type Icon } from '@tabler/icons-react'
import { useId } from 'react'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { diffTrainingConfig } from '@/domain/training/replace-config'
import type { UiMessageParams } from '@/lib/i18n/ui-messages'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type UpdateSummaryProps = Readonly<{
  ui: Ui
  /** Config actuelle de l'entraînement. */
  current: NormalizedConfig
  /** Nouvelle config, valide. */
  next: NormalizedConfig
}>

type Figure = Readonly<{
  count: number
  icon: Icon
  tone: string
  label: keyof UiMessageParams & `training_update_${string}_label`
  hint: keyof UiMessageParams & `training_update_${string}_hint`
}>

/**
 * Bilan d'une mise à jour (F43.4), avant confirmation, en trois cartes (artboard
 * `entrainement-mise-a-jour`) : questions conservées, nouvelles, retirées.
 */
export function UpdateSummary({ ui, current, next }: UpdateSummaryProps) {
  const { text } = ui
  const titleId = useId()
  const { kept, added, removed } = diffTrainingConfig(current, next)
  const figures: Figure[] = [
    {
      count: kept,
      icon: IconCircleCheck,
      tone: 'text-space-training',
      label: 'training_update_kept_label',
      hint: 'training_update_kept_hint',
    },
    {
      count: added,
      icon: IconCirclePlus,
      tone: 'text-foreground',
      label: 'training_update_added_label',
      hint: 'training_update_added_hint',
    },
    {
      count: removed,
      icon: IconCircleMinus,
      tone: 'text-destructive',
      label: 'training_update_removed_label',
      hint: 'training_update_removed_hint',
    },
  ]
  return (
    <div className="flex flex-col gap-2.5 border-t pt-4">
      <h3 id={titleId} className="text-h3">
        {text('training_update_summary', {})}
      </h3>
      <ul aria-labelledby={titleId} className="flex flex-wrap gap-3">
        {figures.map(({ count, icon: FigureIcon, tone, label, hint }) => (
          <li key={label} className="flex flex-[1_1_10rem] flex-col gap-1 rounded-md bg-muted p-4">
            <span className="flex items-center gap-2">
              <FigureIcon aria-hidden="true" className={cn('size-5 shrink-0', tone)} />
              <span className="text-score-md font-bold tabular-nums">{count}</span>
            </span>
            <span className="font-semibold">{text(label, { count })}</span>
            <span className="text-small text-muted-foreground">{text(hint, { count })}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
