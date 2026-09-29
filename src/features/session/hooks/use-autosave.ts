import { useCallback, useEffect, useRef, useState } from 'react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Appelle `save` (tout de suite : le corps d'une fonction `async` s'exécute jusqu'au premier
 * `await`) et ramène tout échec (`false`, rejet, levée synchrone) à `false`.
 */
async function attempt(save: (value: string) => Promise<boolean>, value: string): Promise<boolean> {
  try {
    return await save(value)
  } catch {
    return false
  }
}

/**
 * Sauvegarde différée : `schedule` repousse le délai à chaque appel, `flush` écrit tout de suite la
 * dernière valeur programmée, et le démontage la flushe (Review Focus 1). Une sauvegarde en échec
 * remet sa valeur en attente : le prochain `flush` (sortie du champ, démontage) la retente.
 */
export function useAutosave(
  save: (value: string) => Promise<boolean>,
  delay = 500,
): { schedule: (value: string) => void; flush: () => void; status: AutosaveStatus } {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const saveRef = useRef(save)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pendingRef = useRef<{ value: string } | undefined>(undefined)
  const mountedRef = useRef(true)
  const seqRef = useRef(0)

  useEffect(() => {
    saveRef.current = save
  })

  const flush = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = undefined
    const pending = pendingRef.current
    if (!pending) return
    pendingRef.current = undefined
    seqRef.current += 1
    const seq = seqRef.current
    if (mountedRef.current) setStatus('saving')
    void attempt(saveRef.current, pending.value).then((ok) => {
      // Une sauvegarde dépassée par une plus récente ne touche à rien : ni au statut, ni à la valeur
      // en attente (remise, elle écraserait la plus récente au prochain flush).
      if (seq !== seqRef.current) return
      // Échec : la valeur redevient en attente, sauf si une plus récente a été programmée entre-temps,
      // pour que la sortie du champ ou le démontage la retente.
      if (!ok && pendingRef.current === undefined) pendingRef.current = pending
      if (mountedRef.current) setStatus(ok ? 'saved' : 'error')
    })
  }, [])

  const schedule = useCallback(
    (value: string) => {
      pendingRef.current = { value }
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, delay)
    },
    [delay, flush],
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      flush()
      mountedRef.current = false
    }
  }, [flush])

  return { schedule, flush, status }
}
