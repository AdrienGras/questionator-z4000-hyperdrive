import { useCallback, useEffect, useRef, useState } from 'react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Sauvegarde différée : `schedule` repousse le délai à chaque appel, `flush` écrit tout de suite la
 * dernière valeur programmée, et le démontage la flushe (Review Focus 1).
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

  useEffect(() => {
    saveRef.current = save
  })

  const flush = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = undefined
    const pending = pendingRef.current
    if (!pending) return
    pendingRef.current = undefined
    if (mountedRef.current) setStatus('saving')
    void saveRef.current(pending.value).then(
      (ok) => {
        if (mountedRef.current) setStatus(ok ? 'saved' : 'error')
      },
      () => {
        if (mountedRef.current) setStatus('error')
      },
    )
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
