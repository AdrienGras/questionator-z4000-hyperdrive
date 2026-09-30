import { Button } from '@/components/ui/button'
import { useDbStatus } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { usePwaUpdate } from '@/lib/pwa/hooks'
import { pwaUpdate, type PwaUpdate } from '@/lib/pwa/pwa-update'

/**
 * Pastille « Nouvelle version disponible » (D72), en `waiting` comme en `activated`. Absente en
 * `current`, et quand la base est `outdated` : le bandeau D45 propose déjà de recharger.
 */
export function UpdatePrompt({ update = pwaUpdate }: Readonly<{ update?: PwaUpdate }>) {
  const { text } = useUi()
  const { status, applyUpdate } = usePwaUpdate(update)
  const dbStatus = useDbStatus()
  if (status === 'current' || dbStatus === 'outdated') return null
  return (
    <output className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-sm">{text('update_available', {})}</p>
      <Button size="sm" onClick={() => void applyUpdate()}>
        {text('update_reload', {})}
      </Button>
    </output>
  )
}
