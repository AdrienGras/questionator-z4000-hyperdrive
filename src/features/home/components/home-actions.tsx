import { IconAlertTriangle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePersistenceStatus } from '@/lib/db/persistence'
import type { Ui } from '@/lib/i18n/use-ui'

type HomeActionsProps = Readonly<{ ui: Ui }>

/** Actions de la barre de titre de l'accueil : alerte de persistance seule (création et import sont dans `ActionCards`; le thème vient de `PageShell`). */
export function HomeActions({ ui }: HomeActionsProps) {
  const { text } = ui
  const persistence = usePersistenceStatus()
  return (
    <>
      {persistence === 'best-effort' && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                aria-label={text('persistence_warning_label', {})}
              />
            }
          >
            <IconAlertTriangle />
          </TooltipTrigger>
          <TooltipContent>{text('persistence_warning', {})}</TooltipContent>
        </Tooltip>
      )}
    </>
  )
}
