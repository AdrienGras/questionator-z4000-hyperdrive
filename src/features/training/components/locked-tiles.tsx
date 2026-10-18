import { CategoryBadge } from '@/components/category-badge'
import { categoryAccent } from '@/components/category-tile'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type LockedTilesProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  /** Catégorie de la question en cours ; `undefined` si la question a disparu de la config. */
  currentCategoryId: string | undefined
}>

// Teinte de catégorie (D103), classes écrites en entier (Tailwind ne lit que des littéraux).
const TINT =
  'border border-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_35%,transparent)] ' +
  'bg-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_10%,var(--color-card))] opacity-45'
const CURRENT =
  'border-2 border-[color:var(--category-color,var(--color-muted-foreground))] ' +
  'bg-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_16%,var(--color-card))]'

/**
 * Tuiles de catégorie pendant une question d'entraînement (artboard `entrainement-question`) :
 * compactes, la catégorie en cours marquée, les autres atténuées. Purement visuelles : on ne tire
 * pas tant que la question n'est pas notée ou passée, la liste le dit dans son nom.
 */
export function LockedTiles({ ui, config, currentCategoryId }: LockedTilesProps) {
  const { text, locale } = ui
  return (
    <ul
      aria-label={text('training_tiles_locked', {})}
      className="grid grid-cols-[repeat(auto-fit,minmax(10.625rem,1fr))] gap-3"
    >
      {config.categories.map((category) => {
        const current = category.id === currentCategoryId
        const points = Math.max(...category.scale)
        return (
          <li key={category.id}>
            <div
              style={categoryAccent(category)}
              aria-current={current ? 'true' : undefined}
              className={cn(
                'flex h-14 items-center gap-2.5 rounded-lg px-3.5',
                current ? CURRENT : TINT,
              )}
            >
              <CategoryBadge color={category.color} icon={category.icon} size="md" />
              <span className="min-w-0 truncate font-bold">{category.label}</span>
              <span className="ml-auto shrink-0 text-small font-semibold text-[var(--category-color,var(--color-muted-foreground))] tabular-nums">
                {text('passage_category_max', {
                  max: formatScore(toMilli(points), 'raw', config, locale),
                  points,
                })}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
