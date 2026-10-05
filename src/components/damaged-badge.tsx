import type { Ui } from '@/lib/i18n/use-ui'

/** Pastille « Endommagée » d'une carte dont l'enregistrement ne passe pas la validation. */
export function DamagedBadge({ ui }: Readonly<{ ui: Ui }>) {
  return (
    <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
      {ui.text('damaged_badge', {})}
    </span>
  )
}
