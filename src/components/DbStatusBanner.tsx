import { Button } from '@/components/ui/button'
import type { DbStatus } from '@/db'
import type { Ui } from '@/i18n/use-ui'

type DbStatusBannerProps = Readonly<{
  ui: Ui
  status: DbStatus
}>

/** Bandeau d'état de la base (accueil, création) : recharger si `outdated`, alerte si `unavailable`. */
export function DbStatusBanner({ ui, status }: DbStatusBannerProps) {
  const { text } = ui
  if (status === 'outdated') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border p-4">
        <p>{text('db_outdated', {})}</p>
        <Button onClick={() => window.location.reload()}>{text('db_reload', {})}</Button>
      </div>
    )
  }
  if (status === 'unavailable') {
    return (
      <p role="alert" className="rounded-lg border p-4 text-destructive">
        {text('db_unavailable', {})}
      </p>
    )
  }
  return null
}
