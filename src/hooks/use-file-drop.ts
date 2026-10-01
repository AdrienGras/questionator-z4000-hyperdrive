import { useRef, useState, type DragEvent } from 'react'

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
 * Zone de dépôt d'un fichier (F34) : surimpression et dépôt du premier fichier. La surimpression
 * suit un compteur `dragenter` / `dragleave` plutôt que `relatedTarget`, que WebKit laisse à `null`
 * en passant d'un élément à un enfant (la surimpression clignotait).
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
