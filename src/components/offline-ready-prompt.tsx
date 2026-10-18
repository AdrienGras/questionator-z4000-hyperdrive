import { IconCloudCheck } from '@tabler/icons-react'
import { PROMPT_CLASS, PROMPT_TILE_CLASS } from '@/components/prompt-classes'
import { Button } from '@/components/ui/button'
import { useUi } from '@/lib/i18n/use-ui'
import { useOfflineReady, usePwaUpdate } from '@/lib/pwa/hooks'
import { pwaUpdate, type PwaUpdate } from '@/lib/pwa/pwa-update'
import { cn } from '@/lib/utils'

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
    <output className={PROMPT_CLASS}>
      <span
        aria-hidden
        className={cn(PROMPT_TILE_CLASS, 'bg-space-training/14 text-space-training')}
      >
        <IconCloudCheck className="size-5" />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <strong className="font-semibold">{text('offline_ready_title', {})}</strong>
        <span className="text-sm text-muted-foreground">{text('offline_ready', {})}</span>
      </span>
      <Button size="sm" variant="outline" onClick={dismiss}>
        {text('offline_ready_dismiss', {})}
      </Button>
    </output>
  )
}
