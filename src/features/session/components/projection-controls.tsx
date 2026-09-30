import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Projection, ProjectionRequest } from '@/domain/passage/projection'
import type { Ui } from '@/lib/i18n/use-ui'

type ProjectionControlsProps = Readonly<{
  ui: Ui
  sessionId: string
  projection: Projection
  activeStudentId: string | undefined
  disabled: boolean
  onProject: (projection: ProjectionRequest) => Promise<boolean>
}>

const WINDOW_NAME = 'questionator-present'

/**
 * Pilotage de la vue projetée (F14) : ouvrir la fenêtre, y projeter l'étudiant actif ou
 * revenir à l'écran d'attente. La fenêtre est gardée en `useRef`, liée à la session pour
 * laquelle elle a été ouverte : un second `window.open` la rechargerait, on la ramène donc au
 * premier plan, sauf si elle montre une autre session (alors on la rouvre).
 */
export function ProjectionControls({
  ui,
  sessionId,
  projection,
  activeStudentId,
  disabled,
  onProject,
}: ProjectionControlsProps) {
  const { text } = ui
  const presentWindow = useRef<{ sessionId: string; window: Window } | null>(null)
  const [popupBlocked, setPopupBlocked] = useState(false)

  const openWindow = () => {
    setPopupBlocked(false)
    const current = presentWindow.current
    if (current?.sessionId === sessionId && !current.window.closed) {
      current.window.focus()
      return
    }
    const url = new URL(location.href)
    url.hash = `/present/${sessionId}`
    const opened = window.open(url, WINDOW_NAME)
    presentWindow.current = opened === null ? null : { sessionId, window: opened }
    setPopupBlocked(opened === null)
  }

  const alreadyProjected = projection.mode === 'student' && projection.studentId === activeStudentId

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={openWindow}>
        {text('projection_open', {})}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || activeStudentId === undefined || alreadyProjected}
        onClick={() => {
          setPopupBlocked(false)
          if (activeStudentId !== undefined) {
            void onProject({ mode: 'student', studentId: activeStudentId })
          }
        }}
      >
        {text('projection_project', {})}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || projection.mode === 'waiting'}
        onClick={() => {
          setPopupBlocked(false)
          void onProject({ mode: 'waiting' })
        }}
      >
        {text('projection_waiting', {})}
      </Button>
      {popupBlocked && <p role="alert">{text('projection_popup_blocked', {})}</p>}
    </div>
  )
}
