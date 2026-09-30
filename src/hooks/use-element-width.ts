import { useCallback, useRef, useState, type RefCallback } from 'react'

/** Largeur du contenu d'un élément, suivie par `ResizeObserver` ; 0 avant la première mesure. */
export function useElementWidth<T extends Element>(): [ref: RefCallback<T>, width: number] {
  const [width, setWidth] = useState(0)
  const observer = useRef<ResizeObserver | null>(null)

  const ref = useCallback<RefCallback<T>>((element) => {
    observer.current?.disconnect()
    observer.current = null
    if (!element) return
    const next = new ResizeObserver((entries) => {
      const entry = entries.at(-1)
      if (entry) setWidth(entry.contentRect.width)
    })
    next.observe(element)
    observer.current = next
  }, [])

  return [ref, width]
}
