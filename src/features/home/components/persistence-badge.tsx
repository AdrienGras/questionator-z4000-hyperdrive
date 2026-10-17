import { IconAlertTriangle } from '@tabler/icons-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePersistenceStatus } from '@/lib/db/persistence'
import type { Ui } from '@/lib/i18n/use-ui'

/**
 * Pastille « Stockage non garanti » sous le titre de l'accueil, en `best-effort` seulement.
 * L'artboard pose un `title` ; on garde l'infobulle de l'ancien bouton, que le clavier et le
 * tactile atteignent (D106).
 */
export function PersistenceBadge({ ui }: Readonly<{ ui: Ui }>) {
  const { text } = ui
  const persistence = usePersistenceStatus()
  if (persistence !== 'best-effort') return null
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={text('persistence_warning_label', {})}
            className="mt-2 inline-flex h-6 items-center gap-1.5 rounded-sm bg-muted px-2.5 text-xs font-semibold text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        }
      >
        <IconAlertTriangle aria-hidden className="size-3.5" />
        {text('persistence_warning_label', {})}
      </TooltipTrigger>
      <TooltipContent>{text('persistence_warning', {})}</TooltipContent>
    </Tooltip>
  )
}
