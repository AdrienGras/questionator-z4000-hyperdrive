import { useEffect, useRef } from 'react'

/**
 * Ref d'un titre à focaliser à son montage si `enabled` (titres en `tabIndex={-1}`). Lu au montage
 * seulement : un rendu ultérieur ne reprend pas le focus à l'utilisateur.
 */
export function useFocusOnMount<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null)
  const initial = useRef(enabled)
  useEffect(() => {
    if (initial.current) ref.current?.focus()
  }, [])
  return ref
}
