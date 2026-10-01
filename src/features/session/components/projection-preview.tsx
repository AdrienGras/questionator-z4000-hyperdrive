import { useId } from 'react'

import { ProjectionCanvas } from '@/components/projection/projection-canvas'
import type { ProjectedView } from '@/domain/presentation/projected-view'
import type { Ui } from '@/lib/i18n/use-ui'

type ProjectionPreviewProps = Readonly<{ ui: Ui; view: ProjectedView }>

/**
 * Aperçu réduit de la vue projetée (F22) : le même rendu que la projection, posé sur un
 * canevas de 1280×720 réduit par `transform: scale` à la largeur mesurée. Il ne reçoit que
 * la `ProjectedView` (D69, D77), sans animation de tirage, et reste hors de l'arbre
 * d'accessibilité et du clavier.
 */
export function ProjectionPreview({ ui, view }: ProjectionPreviewProps) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h2 id={titleId} className="text-sm font-medium text-muted-foreground">
        {ui.text('projection_preview_label', {})}
      </h2>
      <ProjectionCanvas view={view} />
    </section>
  )
}
