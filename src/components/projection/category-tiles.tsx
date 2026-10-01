import type { CSSProperties } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import { CategoryLayout } from '@/components/category-layout'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type Category = ProjectedStudentView['categories'][number]

/**
 * État affiché d'une tuile (F33) : `current` (catégorie de la question en cours, même si c'était
 * sa dernière question), `exhausted` (plus de question pour l'étudiant), `waiting` (une autre question est en cours : aucun tirage
 * possible, sans libellé pour ne pas charger l'écran), `unavailable` (passage terminé), sinon
 * `available`.
 */
type TileState = 'available' | 'current' | 'waiting' | 'unavailable' | 'exhausted'

function tileState(
  category: Category,
  currentCategoryId: string | undefined,
  finished: boolean,
): TileState {
  // Avant `exhausted` : tirer la dernière question d'une catégorie l'épuise aussitôt.
  if (category.id === currentCategoryId) return 'current'
  if (category.exhausted) return 'exhausted'
  if (!category.disabled) return 'available'
  return finished ? 'unavailable' : 'waiting'
}

const STATE_CLASSES: Record<TileState, string | undefined> = {
  available: undefined,
  current: 'border-4',
  waiting: 'opacity-60',
  unavailable: 'opacity-60',
  exhausted: 'border-dashed opacity-40',
}

/**
 * Tuiles de catégorie de la vue projetée : purement visuelles (ni bouton ni focusable), couleur
 * en accent de bordure et d'icône comme la grille examinateur (D26), même disposition selon le
 * nombre de catégories (`CategoryLayout`, D74).
 */
export function CategoryTiles({
  ui,
  categories,
  currentCategoryId,
  finished = false,
}: Readonly<{
  ui: Ui
  categories: ProjectedStudentView['categories']
  currentCategoryId?: string
  finished?: boolean
}>) {
  return (
    <CategoryLayout
      className="gap-4"
      items={categories}
      itemKey={(category) => category.id}
      renderItem={(category) => {
        const state = tileState(category, currentCategoryId, finished)
        const accent: (CSSProperties & Record<'--category-color', string>) | undefined =
          category.color === undefined ? undefined : { '--category-color': category.color }
        return (
          <div
            style={accent}
            data-colored={category.color !== undefined}
            data-state={state}
            className={cn(
              'flex h-full flex-col items-center gap-2 rounded-lg border p-5 text-center text-2xl',
              'data-[colored=true]:border-[var(--category-color)]',
              STATE_CLASSES[state],
            )}
          >
            {category.icon !== undefined && (
              <CategoryIcon
                name={category.icon}
                className="size-8 shrink-0 text-[var(--category-color,currentColor)]"
              />
            )}
            <span className="font-semibold">{category.label}</span>
            {state === 'exhausted' && (
              <span className="text-base text-muted-foreground">
                {ui.text('present_category_exhausted', {})}
              </span>
            )}
            {state === 'unavailable' && (
              <span className="text-base text-muted-foreground">
                {ui.text('present_category_unavailable', {})}
              </span>
            )}
          </div>
        )
      }}
    />
  )
}
