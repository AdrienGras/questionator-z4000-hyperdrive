import { useId } from 'react'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { diffTrainingConfig } from '@/domain/training/replace-config'
import type { Ui } from '@/lib/i18n/use-ui'

type UpdateSummaryProps = Readonly<{
  ui: Ui
  /** Config actuelle de l'entraînement. */
  current: NormalizedConfig
  /** Nouvelle config, valide. */
  next: NormalizedConfig
}>

/** Bilan d'une mise à jour (F43.4), avant confirmation : questions conservées, nouvelles, retirées. */
export function UpdateSummary({ ui, current, next }: UpdateSummaryProps) {
  const { text } = ui
  const titleId = useId()
  const { kept, added, removed } = diffTrainingConfig(current, next)
  return (
    <div className="flex flex-col gap-1">
      <h3 id={titleId} className="font-semibold">
        {text('training_update_summary', {})}
      </h3>
      <ul aria-labelledby={titleId} className="list-disc pl-6 text-sm">
        <li>{text('training_update_kept', { count: kept })}</li>
        <li>{text('training_update_added', { count: added })}</li>
        <li>{text('training_update_removed', { count: removed })}</li>
      </ul>
    </div>
  )
}
