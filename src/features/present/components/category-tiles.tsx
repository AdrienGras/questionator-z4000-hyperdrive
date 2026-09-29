import type { CSSProperties } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

/**
 * Tuiles de catégorie de la vue projetée : purement visuelles (ni bouton ni focusable), couleur
 * en accent de bordure et d'icône comme la grille examinateur (D26).
 */
export function CategoryTiles({
  ui,
  categories,
}: Readonly<{ ui: Ui; categories: ProjectedStudentView['categories'] }>) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => {
        const accent: (CSSProperties & Record<'--category-color', string>) | undefined =
          category.color === undefined ? undefined : { '--category-color': category.color }
        return (
          <li
            key={category.id}
            style={accent}
            data-colored={category.color !== undefined}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border p-5 text-center text-2xl',
              'data-[colored=true]:border-[var(--category-color)]',
              (category.exhausted || category.disabled) && 'opacity-50',
            )}
          >
            {category.icon !== undefined && (
              <CategoryIcon
                name={category.icon}
                className="size-8 shrink-0 text-[var(--category-color,currentColor)]"
              />
            )}
            <span className="font-semibold">{category.label}</span>
            {category.exhausted && (
              <span className="text-base text-muted-foreground">
                {ui.text('present_category_exhausted', {})}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
