import { useEffect, useRef, useState, type DragEvent } from 'react'

/** Un fichier est survolé ou déposé (par opposition à du texte, une image glissée, etc.). */
export function hasFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
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

/**
 * Filet `window` pendant un survol (#87) : si l'élément survolé est démonté, son `dragleave`
 * n'atteint jamais React et le compteur reste positif. On remet tout à zéro quand le glisser quitte
 * la fenêtre ou qu'un fichier est déposé n'importe où. Quitter la fenêtre = `dragleave` sans
 * `relatedTarget` **et** sans `dragenter` juste avant : en passant d'un élément à l'autre, le
 * navigateur envoie le `dragenter` du nouveau avant le `dragleave` de l'ancien (WebKit laisse alors
 * `relatedTarget` à `null`, d'où ce second critère). Écoute en capture : un `stopPropagation`
 * (`isolate`, garde de page) ne le masque pas.
 */
function useWindowDragReset(active: boolean, reset: () => void) {
  const resetRef = useRef(reset)
  useEffect(() => {
    resetRef.current = reset
  })
  useEffect(() => {
    if (!active) return undefined
    let entered = false
    const onEnter = () => {
      entered = true
    }
    const onLeave = (event: globalThis.DragEvent) => {
      // `relatedTarget` peut manquer (jsdom, événements synthétiques) : traité comme `null`.
      if (event.relatedTarget) return
      if (entered) entered = false
      else resetRef.current()
    }
    const onDrop = () => resetRef.current()
    window.addEventListener('dragenter', onEnter, true)
    window.addEventListener('dragleave', onLeave, true)
    window.addEventListener('drop', onDrop, true)
    return () => {
      window.removeEventListener('dragenter', onEnter, true)
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
