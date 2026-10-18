import { IconDownload } from '@tabler/icons-react'
import { PROMPT_CLASS, PROMPT_TILE_CLASS } from '@/components/prompt-classes'
import { Button } from '@/components/ui/button'
import { useDbStatus } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { usePwaUpdate } from '@/lib/pwa/hooks'
import { pwaUpdate, type PwaUpdate } from '@/lib/pwa/pwa-update'
import { cn } from '@/lib/utils'

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
    <output className={PROMPT_CLASS}>
      <span aria-hidden className={cn(PROMPT_TILE_CLASS, 'bg-primary/16 text-link')}>
        <IconDownload className="size-5" />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <strong className="font-semibold">{text('update_available', {})}</strong>
        <span className="text-sm text-muted-foreground">{text('update_available_body', {})}</span>
      </span>
      <Button size="sm" onClick={() => void applyUpdate()}>
        {text('update_reload', {})}
      </Button>
    </output>
  )
}
