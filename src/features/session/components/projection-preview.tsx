import { useId, type ReactNode } from 'react'

import { ProjectionCanvas } from '@/components/projection/projection-canvas'
import type { ProjectedView } from '@/domain/presentation/projected-view'
import type { Ui } from '@/lib/i18n/use-ui'

type ProjectionPreviewProps = Readonly<{
  ui: Ui
  view: ProjectedView
  /** Action de l'en-tête, alignée à droite du titre (« Ouvrir la vue projetée », F39). */
  action?: ReactNode
  /** Message sous l'en-tête, près de l'action (popup bloquée). */
  notice?: ReactNode
  /** Sous l'aperçu : bascule de projection et bandeau. */
  children?: ReactNode
}>

/**
 * Carte « Vue projetée » (F22, artboard `passage-question`) : le même rendu que la projection, posé sur un
 * canevas de 1280×720 réduit par `transform: scale` à la largeur mesurée. Il ne reçoit que
 * la `ProjectedView` (D69, D77), sans animation de tirage, et reste hors de l'arbre
 * d'accessibilité et du clavier.
 */
export function ProjectionPreview({ ui, view, action, notice, children }: ProjectionPreviewProps) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-lg bg-card p-5 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={titleId} className="text-h3">
          {ui.text('projection_preview_label', {})}
        </h2>
        {action}
      </div>
      {notice}
      <ProjectionCanvas view={view} />
      {children}
    </section>
  )
}
