import { ProjectionHalos } from '@/components/projection/projection-halos'
import { StudentScreen } from '@/components/projection/student-screen'
import { WaitingScreen } from '@/components/projection/waiting-screen'
import type { ProjectedView } from '@/domain/presentation/projected-view'
import { cn } from '@/lib/utils'

function haloPlacement(view: ProjectedView): 'waiting' | 'student' | 'final' {
  if (view.mode === 'waiting') return 'waiting'
  return view.final === undefined ? 'student' : 'final'
}

/**
 * Écran de la vue projetée, partagé entre la fenêtre projetée et l'aperçu de l'examinateur :
 * n'affiche que la `ProjectedView`. Racine en `@container` (les tuiles s'adaptent à sa largeur).
 */
export function ProjectedScreen({
  view,
  animate = true,
  className,
}: Readonly<{ view: ProjectedView; animate?: boolean; className?: string }>) {
  return (
    <div className={cn('@container relative isolate flex flex-col overflow-hidden', className)}>
      <ProjectionHalos placement={haloPlacement(view)} />
      {view.mode === 'student' ? (
        // `key` : un autre étudiant projeté (homonyme compris) repart d'un premier rendu : son
        // énoncé présent au montage n'est jamais animé.
        <StudentScreen key={view.student.order} view={view} animate={animate} />
      ) : (
        <WaitingScreen title={view.examTitle} />
      )}
    </div>
  )
}
