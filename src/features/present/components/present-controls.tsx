import { IconArrowsMaximize, IconArrowsMinimize } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { ColorModeToggle } from '@/components/color-mode-toggle'
import { Button } from '@/components/ui/button'
import { useUi } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

/**
 * Commandes de la vue projetée : plein écran (si l'API existe) et mode de couleur. `idle` (3 s
 * sans activité, décidé par la page) les efface ; toute activité, dont Tab, les ramène, et
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
    request.catch(() => {})
  }

  return (
    <div
      data-controls
      className={cn(
        'absolute top-4 right-4 flex items-center gap-2 transition-opacity duration-300 focus-within:opacity-100',
        idle && 'opacity-0',
      )}
    >
      {canFullscreen && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={ui.text(fullscreen ? 'present_exit_fullscreen' : 'present_fullscreen', {})}
          onClick={toggleFullscreen}
        >
          {fullscreen ? <IconArrowsMinimize /> : <IconArrowsMaximize />}
        </Button>
      )}
      <ColorModeToggle ui={ui} />
    </div>
  )
}
