import { IconDatabase, IconRefresh } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { DbStatus } from '@/lib/db/db'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type DbStatusBannerProps = Readonly<{
  ui: Ui
  status: DbStatus
}>

const BANNER_CLASS = 'flex flex-wrap items-center gap-4 rounded-lg px-5 py-4'
const TILE_CLASS = 'inline-flex size-10 shrink-0 items-center justify-center rounded-md'

/**
 * Bandeau d'état de la base (accueil, création, vue projetée), titre puis corps (artboard
 * `bandeaux`) : recharger si `outdated`, alerte si `unavailable`.
 */
export function DbStatusBanner({ ui, status }: DbStatusBannerProps) {
  const { text } = ui
  if (status === 'outdated') {
    return (
      <div role="alert" className={cn(BANNER_CLASS, 'bg-card shadow-card')}>
        <span aria-hidden className={cn(TILE_CLASS, 'bg-muted')}>
          <IconRefresh className="size-5" />
        </span>
        <p className="flex-[1_1_22rem]">
          <strong className="font-semibold">{text('db_outdated_title', {})}</strong>{' '}
          <span className="text-muted-foreground">{text('db_outdated', {})}</span>
        </p>
        <Button onClick={() => window.location.reload()}>
          <IconRefresh aria-hidden />
          {text('db_reload', {})}
        </Button>
      </div>
    )
  }
  if (status === 'unavailable') {
    return (
      <div
        role="alert"
        className={cn(BANNER_CLASS, 'border border-destructive/45 bg-destructive/8')}
      >
        <span aria-hidden className={cn(TILE_CLASS, 'bg-destructive/14 text-destructive')}>
          <IconDatabase className="size-5" />
        </span>
        <p className="flex-[1_1_22rem]">
          <strong className="font-semibold text-destructive">
            {text('db_unavailable_title', {})}
          </strong>{' '}
          <span className="text-muted-foreground">{text('db_unavailable', {})}</span>
        </p>
      </div>
    )
  }
  return null
}
