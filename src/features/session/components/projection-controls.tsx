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
 * revenir à l'écran d'attente. La fenêtre est gardée en `useRef` : un second `window.open`
 * sur une fenêtre déjà ouverte la rechargerait, on la ramène donc au premier plan.
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
  const presentWindow = useRef<Window | null>(null)
  const [popupBlocked, setPopupBlocked] = useState(false)

  const openWindow = () => {
    if (presentWindow.current !== null && !presentWindow.current.closed) {
      presentWindow.current.focus()
      return
    }
    const url = new URL(location.href)
    url.hash = `/present/${sessionId}`
    presentWindow.current = window.open(url, WINDOW_NAME)
    setPopupBlocked(presentWindow.current === null)
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
        onClick={() => void onProject({ mode: 'waiting' })}
      >
        {text('projection_waiting', {})}
      </Button>
      {popupBlocked && <p role="alert">{text('projection_popup_blocked', {})}</p>}
    </div>
  )
}
