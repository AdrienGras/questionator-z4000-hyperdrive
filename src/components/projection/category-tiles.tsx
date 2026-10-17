import { useId, type CSSProperties } from 'react'
import { CategoryBadge } from '@/components/category-badge'
import { CategoryLayout } from '@/components/category-layout'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import { formatRawScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
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

// Teinte de catégorie (D103), classes écrites en entier (Tailwind ne lit que des littéraux).
const TINT =
  'border-[1.5px] border-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_35%,transparent)] ' +
  'bg-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_10%,var(--color-card))]'
const CURRENT =
  'border-2 border-[color:var(--category-color,var(--color-primary))] ' +
  'bg-[color:color-mix(in_oklch,var(--category-color,var(--color-primary))_18%,var(--color-card))]'
const POINTS_COLOR = 'text-[var(--category-color,var(--color-muted-foreground))]'

/** Grande grille (aucune question) et rangée compacte (question en cours) : artboards `projection-tuiles` et `projection-question`. */
const LAYOUT = {
  grid: {
    tile: 'min-h-55 flex-col items-start gap-4 rounded-xl p-7',
    badge: 'projection-lg',
    label: 'text-4xl font-extrabold tracking-[-0.02em]',
    points: 'mt-auto text-[1.625rem] leading-[1.875rem] font-bold',
  },
  row: {
    tile: 'h-18 items-center gap-3 rounded-lg px-4',
    badge: 'projection-sm',
    label: 'min-w-0 truncate text-[1.375rem] leading-7 font-bold',
    points: 'ml-auto shrink-0 text-lg font-bold',
  },
} as const

const DIMMED: Record<TileState, boolean> = {
  available: false,
  current: false,
  waiting: true,
  unavailable: true,
  exhausted: true,
}

/**
 * Tuiles de catégorie de la vue projetée : purement visuelles (ni bouton ni focusable), teintées par
 * la couleur de la catégorie comme la grille examinateur, même disposition selon le nombre de
 * catégories (`CategoryLayout`, D74). `grid` (aucune question en cours) : grandes tuiles sous la
 * consigne « Choisissez une catégorie », sans consigne une fois le passage fini. `row` (question en
 * cours) : tuiles compactes, la catégorie tirée marquée, les autres atténuées.
 */
export function CategoryTiles({
  ui,
  categories,
  currentCategoryId,
  finished = false,
  variant = 'grid',
}: Readonly<{
  ui: Ui
  categories: ProjectedStudentView['categories']
  currentCategoryId?: string
  finished?: boolean
  variant?: 'grid' | 'row'
}>) {
  const titleId = useId()
  const layout = LAYOUT[variant]
  const showTitle = variant === 'grid' && !finished
  const tiles = (
    <CategoryLayout
      className={variant === 'grid' ? 'gap-6' : 'gap-4'}
      aria-labelledby={showTitle ? titleId : undefined}
      aria-label={variant === 'row' ? ui.text('present_categories', {}) : undefined}
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
            aria-current={state === 'current' ? 'true' : undefined}
            className={cn(
              'flex h-full',
              layout.tile,
              state === 'current' ? CURRENT : TINT,
              state === 'exhausted' && 'border-dashed',
              DIMMED[state] && 'opacity-45',
            )}
          >
            <CategoryBadge color={category.color} icon={category.icon} size={layout.badge} />
            <span className={layout.label}>{category.label}</span>
            {/* Même libellé que la grille examinateur ; absent sans `showCategoryPoints`. */}
            {category.maxPoints !== undefined && (
              <span className={cn(layout.points, POINTS_COLOR, 'tabular-nums')}>
                {ui.text('passage_category_max', {
                  max: formatRawScore(toMilli(category.maxPoints), ui.locale),
                  points: category.maxPoints,
                })}
              </span>
            )}
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
  if (!showTitle) return tiles
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <h2 id={titleId} className="text-2xl font-semibold text-muted-foreground">
        {ui.text('present_choose_category', {})}
      </h2>
      {tiles}
    </section>
  )
}
