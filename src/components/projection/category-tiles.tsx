import type { CSSProperties } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import { CategoryLayout } from '@/components/category-layout'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

/**
 * Tuiles de catégorie de la vue projetée : purement visuelles (ni bouton ni focusable), couleur
 * en accent de bordure et d'icône comme la grille examinateur (D26), même disposition selon le
 * nombre de catégories (`CategoryLayout`, D74).
 */
export function CategoryTiles({
  ui,
  categories,
}: Readonly<{ ui: Ui; categories: ProjectedStudentView['categories'] }>) {
  return (
    <CategoryLayout
      className="gap-4"
      items={categories}
      itemKey={(category) => category.id}
      renderItem={(category) => {
        const accent: (CSSProperties & Record<'--category-color', string>) | undefined =
          category.color === undefined ? undefined : { '--category-color': category.color }
        return (
          <div
            style={accent}
            data-colored={category.color !== undefined}
            className={cn(
              'flex h-full flex-col items-center gap-2 rounded-lg border p-5 text-center text-2xl',
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
          </div>
        )
      }}
    />
  )
}
