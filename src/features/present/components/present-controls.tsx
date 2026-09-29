import { IconArrowsMaximize, IconArrowsMinimize } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { ColorModeToggle } from '@/components/color-mode-toggle'
import { Button } from '@/components/ui/button'
import { useIdle } from '@/features/present/hooks/use-idle'
import { useUi } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

const IDLE_DELAY_MS = 3000

/**
 * Commandes de la vue projetée : plein écran (si l'API existe) et mode de couleur. Après 3 s
 * d'inactivité elles s'effacent et le curseur du `main` englobant se cache ; toute activité (dont
 * Tab) les ramène, et `focus-within` les garde visibles tant qu'une commande a le focus.
 */
export function PresentControls() {
  const ui = useUi()
  const idle = useIdle(IDLE_DELAY_MS)
  const ref = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement))
  const canFullscreen = typeof document.documentElement.requestFullscreen === 'function'

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    const main = ref.current?.closest('main')
    main?.classList.toggle('cursor-none', idle)
    return () => main?.classList.remove('cursor-none')
  }, [idle])

  const toggleFullscreen = () => {
    void (fullscreen ? document.exitFullscreen() : document.documentElement.requestFullscreen())
  }

  return (
    <div
      ref={ref}
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
