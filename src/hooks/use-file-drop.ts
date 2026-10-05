import { useEffect, useRef, useState, type DragEvent } from 'react'

/** Un fichier est survolé ou déposé (par opposition à du texte, une image glissée, etc.). */
export function hasFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

/**
 * Garde de dépôt au niveau d'une page : un fichier déposé hors des zones ne doit jamais être ouvert
 * par le navigateur (le formulaire serait perdu). Les zones gèrent leur propre dépôt et s'exécutent
 * avant, par propagation. À étaler sur l'élément racine de la page.
 */
export const PAGE_DROP_GUARD = {
  onDragOver(event: DragEvent<HTMLElement>) {
    if (!hasFiles(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'none'
  },
  onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
  },
}

type FileDropOptions = Readonly<{
  /** Survol et dépôt refusés : le navigateur n'ouvre pas le fichier, mais rien n'est lu. */
  disabled?: boolean
  /** Arrête la propagation : la zone passe avant une garde posée sur la page. */
  isolate?: boolean
  onFile: (file: File) => void
}>

type DropProps<T extends HTMLElement> = {
  onDragEnter: (event: DragEvent<T>) => void
  onDragOver: (event: DragEvent<T>) => void
  onDragLeave: (event: DragEvent<T>) => void
  onDrop: (event: DragEvent<T>) => void
}

/** Délai sans `dragenter` ni `dragover` après lequel un `dragleave` sans cible vaut sortie de fenêtre. */
export const WINDOW_EXIT_DELAY_MS = 100

/**
 * Filet `window` pendant un survol (#87) : si l'élément survolé est démonté, son `dragleave`
 * n'atteint jamais React et le compteur reste positif. On remet tout à zéro quand un fichier est
 * déposé n'importe où, ou quand le glisser quitte la fenêtre. Sortie de fenêtre : un `dragleave`
 * sans `relatedTarget` lance un délai, qu'annule tout `dragenter` ou `dragover` (le navigateur en
 * envoie un toutes les ~50 ms tant que le pointeur est dans la fenêtre). Indépendant de l'ordre
 * des événements : WebKit laisse aussi `relatedTarget` à `null` en passant d'un élément à un enfant,
 * mais le `dragover` suivant annule le délai. Écoute en capture : un `stopPropagation` (`isolate`,
 * garde de page) ne le masque pas.
 */
function useWindowDragReset(active: boolean, reset: () => void) {
  const resetRef = useRef(reset)
  useEffect(() => {
    resetRef.current = reset
  })
  useEffect(() => {
    if (!active) return undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const cancel = () => {
      clearTimeout(timer)
      timer = undefined
    }
    const onLeave = (event: globalThis.DragEvent) => {
      // `relatedTarget` peut manquer (jsdom, événements synthétiques) : traité comme `null`.
      if (event.relatedTarget) return
      cancel()
      timer = setTimeout(() => {
        timer = undefined
        resetRef.current()
      }, WINDOW_EXIT_DELAY_MS)
    }
    const onDrop = () => {
      cancel()
      resetRef.current()
    }
    window.addEventListener('dragenter', cancel, true)
    window.addEventListener('dragover', cancel, true)
    window.addEventListener('dragleave', onLeave, true)
    window.addEventListener('drop', onDrop, true)
    return () => {
      cancel()
      window.removeEventListener('dragenter', cancel, true)
      window.removeEventListener('dragover', cancel, true)
      window.removeEventListener('dragleave', onLeave, true)
      window.removeEventListener('drop', onDrop, true)
    }
  }, [active])
}

/**
 * Zone de dépôt d'un fichier (F34) : surimpression et dépôt du premier fichier. La surimpression
 * suit un compteur `dragenter` / `dragleave` plutôt que `relatedTarget`, que WebKit laisse à `null`
 * en passant d'un élément à un enfant (la surimpression clignotait). Filet `window` en plus
 * (`useWindowDragReset`).
 */
export function useFileDrop<T extends HTMLElement = HTMLDivElement>({
  disabled = false,
  isolate = false,
  onFile,
}: FileDropOptions): { dragging: boolean; dropProps: DropProps<T> } {
  const depth = useRef(0)
  const [dragging, setDragging] = useState(false)

  function reset() {
    depth.current = 0
    setDragging(false)
  }

  useWindowDragReset(dragging, reset)

  return {
    dragging: dragging && !disabled,
    dropProps: {
      onDragEnter(event) {
        if (!hasFiles(event)) return
        depth.current += 1
        setDragging(true)
      },
      onDragOver(event) {
        if (!hasFiles(event)) return
        // Toujours empêché : sinon le navigateur ouvre le fichier et quitte l'application.
        event.preventDefault()
        if (isolate) event.stopPropagation()
        if (disabled) event.dataTransfer.dropEffect = 'none'
        // `dragover` sans `dragenter` préalable (survol commencé avant le montage) : on l'amorce.
        if (depth.current === 0) {
          depth.current = 1
          setDragging(true)
        }
      },
      onDragLeave() {
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setDragging(false)
      },
      onDrop(event) {
        if (!hasFiles(event)) return
        event.preventDefault()
        if (isolate) event.stopPropagation()
        reset()
        const file = event.dataTransfer.files[0]
        if (!disabled && file) onFile(file)
      },
    },
  }
}
