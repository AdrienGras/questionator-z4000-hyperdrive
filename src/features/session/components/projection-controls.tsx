import { IconDeviceDesktop, IconPlayerPause } from '@tabler/icons-react'
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

// Bascule à deux positions (artboard `passage-question`) : la position courante en carte.
const SEGMENT =
  'h-8 flex-1 rounded-[9px] border-0 text-small font-semibold text-muted-foreground aria-pressed:bg-card aria-pressed:disabled:opacity-100 aria-pressed:text-foreground aria-pressed:shadow-card'

/**
 * Pilotage de la vue projetée (F14) en bascule : y projeter l'étudiant actif (« Cet étudiant ») ou
 * revenir à l'écran d'attente. La position courante est pressée et désactivée ; sans étudiant actif
 * ou pendant une écriture, les deux sont désactivées. L'ouverture de la fenêtre est à part, sur la
 * ligne du titre de l'aperçu (F39, `usePresentWindow`).
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

  const waiting = projection.mode === 'waiting'
  return (
    <fieldset
      aria-label={text('projection_group', {})}
      className="m-0 flex min-w-0 gap-1 rounded-md border-0 bg-muted p-1"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={alreadyProjected}
        aria-label={text('projection_project', {})}
        className={SEGMENT}
        disabled={disabled || activeStudentId === undefined || alreadyProjected}
        onClick={() => {
          onAction?.()
          if (activeStudentId !== undefined) {
            void onProject({ mode: 'student', studentId: activeStudentId })
          }
        }}
      >
        <IconDeviceDesktop aria-hidden />
        {text('projection_project_short', {})}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={waiting}
        className={SEGMENT}
        disabled={disabled || waiting}
        onClick={() => {
          onAction?.()
          void onProject({ mode: 'waiting' })
        }}
      >
        <IconPlayerPause aria-hidden />
        {text('projection_waiting', {})}
      </Button>
    </fieldset>
  )
}
