import { IconAlertTriangle } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePersistenceStatus } from '@/lib/db/persistence'
import type { Ui } from '@/lib/i18n/use-ui'

type HomeActionsProps = Readonly<{
  ui: Ui
  storageAvailable: boolean
  importDisabled: boolean
  onImport: () => void
}>

/** Actions de la barre de titre de l'accueil : alerte de persistance, import, création (le thème vient de `PageShell`). */
export function HomeActions({ ui, storageAvailable, importDisabled, onImport }: HomeActionsProps) {
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
      <Button variant="outline" disabled={importDisabled} onClick={onImport}>
        {text('home_import', {})}
      </Button>
      {storageAvailable && (
        <Link to="/new" className={buttonVariants()}>
          {text('home_create', {})}
        </Link>
      )}
    </>
  )
}
