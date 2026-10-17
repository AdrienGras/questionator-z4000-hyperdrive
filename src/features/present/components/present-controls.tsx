import { IconArrowsMaximize, IconArrowsMinimize } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUi } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

/**
 * Commandes de la vue projetée (artboards `projection-*`) : plein écran, si l'API existe. `idle`
 * (3 s sans activité, décidé par la page) les efface ; toute activité, dont Tab, les ramène, et
 * `focus-within` les garde visibles tant qu'une commande a le focus.
 */
export function PresentControls({ idle }: Readonly<{ idle: boolean }>) {
  const ui = useUi()
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement))
  const canFullscreen = typeof document.documentElement.requestFullscreen === 'function'

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    const request = fullscreen
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen()
    // `requestFullscreen()` renvoie `undefined` sur d'anciens WebKit ; un refus est sans conséquence.
    Promise.resolve(request).catch(() => undefined)
  }

  return (
    <div
      data-controls
      className={cn(
        'absolute top-6 right-6 z-10 flex items-center gap-2 transition-opacity duration-300 focus-within:opacity-100',
        idle && 'opacity-0',
      )}
    >
      {canFullscreen && (
        <Button
          variant="outline"
          size="icon"
          className="bg-card text-muted-foreground"
          title={fullscreen ? undefined : ui.text('present_fullscreen_hint', {})}
          aria-label={ui.text(fullscreen ? 'present_exit_fullscreen' : 'present_fullscreen', {})}
          onClick={toggleFullscreen}
        >
          {fullscreen ? <IconArrowsMinimize /> : <IconArrowsMaximize />}
        </Button>
      )}
    </div>
  )
}
