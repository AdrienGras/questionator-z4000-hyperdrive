import { IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { Projection, ProjectionRequest } from '@/domain/passage/projection'
import type { Ui } from '@/lib/i18n/use-ui'

type ProjectionControlsProps = Readonly<{
  ui: Ui
  projection: Projection
  activeStudentId: string | undefined
  disabled: boolean
  onProject: (projection: ProjectionRequest) => Promise<boolean>
  /** Appelé avant chaque action : efface le message de popup bloquée. */
  onAction?: () => void
}>

/**
 * Pilotage de la vue projetée (F14) : y projeter l'étudiant actif ou revenir à l'écran d'attente.
 * L'ouverture de la fenêtre est à part, sur la ligne du titre de l'aperçu (F39, `usePresentWindow`).
 */
export function ProjectionControls({
  ui,
  projection,
  activeStudentId,
  disabled,
  onProject,
  onAction,
}: ProjectionControlsProps) {
  const { text } = ui
  const alreadyProjected = projection.mode === 'student' && projection.studentId === activeStudentId

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || activeStudentId === undefined || alreadyProjected}
        onClick={() => {
          onAction?.()
          if (activeStudentId !== undefined) {
            void onProject({ mode: 'student', studentId: activeStudentId })
          }
        }}
      >
        <IconPlayerPlay aria-hidden />
        {text('projection_project', {})}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || projection.mode === 'waiting'}
        onClick={() => {
          onAction?.()
          void onProject({ mode: 'waiting' })
        }}
      >
        <IconPlayerPause aria-hidden />
        {text('projection_waiting', {})}
      </Button>
    </div>
  )
}
