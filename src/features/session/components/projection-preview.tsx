import { useId } from 'react'

import { ProjectedScreen } from '@/components/projection/projected-screen'
import type { ProjectedView } from '@/domain/presentation/projected-view'
import { useElementWidth } from '@/hooks/use-element-width'
import type { Ui } from '@/lib/i18n/use-ui'

const CANVAS_WIDTH = 1280

type ProjectionPreviewProps = Readonly<{ ui: Ui; view: ProjectedView }>

/**
 * Aperçu réduit de la vue projetée (F22) : le même rendu que la projection, posé sur un
 * canevas de 1280×720 réduit par `transform: scale` à la largeur mesurée. Il ne reçoit que
 * la `ProjectedView` (D69, D77), sans animation de tirage, et reste hors de l'arbre
 * d'accessibilité et du clavier.
 */
export function ProjectionPreview({ ui, view }: ProjectionPreviewProps) {
  const titleId = useId()
  const [ref, width] = useElementWidth<HTMLDivElement>()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h2 id={titleId} className="text-sm font-medium text-muted-foreground">
        {ui.text('projection_preview_label', {})}
      </h2>
      <div ref={ref} className="relative aspect-video w-full overflow-hidden rounded-md border">
        <div
          data-projection-canvas
          aria-hidden="true"
          inert
          className="absolute top-0 left-0 h-[720px] w-[1280px] origin-top-left bg-background text-foreground"
          style={{
            transform: `scale(${width / CANVAS_WIDTH})`,
            visibility: width === 0 ? 'hidden' : undefined,
          }}
        >
          <ProjectedScreen view={view} animate={false} className="h-full" />
        </div>
      </div>
    </section>
  )
}
