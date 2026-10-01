import { Button } from '@/components/ui/button'
import { useUi } from '@/lib/i18n/use-ui'
import { useOfflineReady, usePwaUpdate } from '@/lib/pwa/hooks'
import { pwaUpdate, type PwaUpdate } from '@/lib/pwa/pwa-update'

/**
 * Pastille « Prête pour le hors ligne » (F36, D86), une fois le premier pré-cache terminé, jusqu'au
 * clic sur « OK ». Même place que `UpdatePrompt`, qui a la priorité quand une version est proposée.
 */
export function OfflineReadyPrompt({ update = pwaUpdate }: Readonly<{ update?: PwaUpdate }>) {
  const { text } = useUi()
  const { offlineReady, dismiss } = useOfflineReady(update)
  const { status } = usePwaUpdate(update)
  if (!offlineReady || status !== 'current') return null
  return (
    <output className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-sm">{text('offline_ready', {})}</p>
      <Button size="sm" variant="outline" onClick={dismiss}>
        {text('offline_ready_dismiss', {})}
      </Button>
    </output>
  )
}
