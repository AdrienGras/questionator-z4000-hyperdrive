import { useEffect, useState } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'pointerdown'] as const

/** Vrai après `delayMs` sans mouvement de souris, touche ni appui ; toute activité le remet à faux. */
export function useIdle(delayMs: number): boolean {
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), delayMs)
    const onActivity = () => {
      clearTimeout(timer)
      setIdle(false)
      timer = setTimeout(() => setIdle(true), delayMs)
    }
    for (const type of ACTIVITY_EVENTS) window.addEventListener(type, onActivity)
    return () => {
      clearTimeout(timer)
      for (const type of ACTIVITY_EVENTS) window.removeEventListener(type, onActivity)
    }
  }, [delayMs])
  return idle
}
