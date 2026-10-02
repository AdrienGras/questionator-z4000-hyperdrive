import { useCallback, useRef, useState } from 'react'

const WINDOW_NAME = 'questionator-present'

/**
 * Fenêtre de la vue projetée (F14, F39). Elle est gardée en `useRef`, liée à la session pour
 * laquelle elle a été ouverte : un second `window.open` la rechargerait, on la ramène donc au
 * premier plan, sauf si elle montre une autre session (alors on la rouvre). `popupBlocked` signale
 * une ouverture refusée par le navigateur ; `clearPopupBlocked` l'efface (action de pilotage).
 */
export function usePresentWindow(sessionId: string) {
  const presentWindow = useRef<{ sessionId: string; window: Window } | null>(null)
  const [popupBlocked, setPopupBlocked] = useState(false)

  const openWindow = useCallback(() => {
    setPopupBlocked(false)
    const current = presentWindow.current
    if (current?.sessionId === sessionId && !current.window.closed) {
      current.window.focus()
      return
    }
    // Même document (origine et chemin, la base de l'app), sans les paramètres de recherche de la
    // page examinateur : la vue projetée n'en lit aucun, et elle n'hérite de rien de cette page.
    const url = new URL(location.href)
    url.search = ''
    url.hash = `/present/${sessionId}`
    const opened = window.open(url, WINDOW_NAME)
    presentWindow.current = opened === null ? null : { sessionId, window: opened }
    setPopupBlocked(opened === null)
  }, [sessionId])

  const clearPopupBlocked = useCallback(() => setPopupBlocked(false), [])

  return { openWindow, popupBlocked, clearPopupBlocked }
}
