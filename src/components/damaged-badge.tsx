import { IconAlertTriangle } from '@tabler/icons-react'
import type { Ui } from '@/lib/i18n/use-ui'

/** Pastille « Endommagée » d'une carte dont l'enregistrement ne passe pas la validation. */
export function DamagedBadge({ ui }: Readonly<{ ui: Ui }>) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-sm border border-destructive px-2.5 text-xs font-semibold whitespace-nowrap text-destructive">
      <IconAlertTriangle aria-hidden className="size-3.5" />
      {ui.text('damaged_badge', {})}
    </span>
  )
}
