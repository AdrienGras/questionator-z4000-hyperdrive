import { IconAlertTriangle } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePersistenceStatus } from '@/lib/db/persistence'
import type { Ui } from '@/lib/i18n/use-ui'

type HomeHeaderProps = Readonly<{
  ui: Ui
  storageAvailable: boolean
  importDisabled: boolean
  onImport: () => void
}>

export function HomeHeader({ ui, storageAvailable, importDisabled, onImport }: HomeHeaderProps) {
  const { text } = ui
  const persistence = usePersistenceStatus()
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold tracking-tight">{text('app_title', {})}</h1>
      <div className="flex flex-wrap items-center gap-2">
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
      </div>
    </header>
  )
}
