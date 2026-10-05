import type { CSSProperties } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Ui } from '@/lib/i18n/use-ui'

export type CategoryAccent = CSSProperties & Record<'--category-color', string>

/** Accent couleur d'une tuile (D26) : `--category-color`, posé sur le bouton qui la contient. */
export function categoryAccent(category: NormalizedCategory): CategoryAccent | undefined {
  const { color } = category
  return color === undefined ? undefined : { '--category-color': color }
}

type CategoryTileProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  category: NormalizedCategory
}>

/**
 * Contenu d'une tuile de catégorie : icône teintée par `--category-color`, libellé et maximum du
 * barème en points. Le bouton qui l'entoure porte l'accent (`categoryAccent`) et l'état.
 */
export function CategoryTile({ ui, config, category }: CategoryTileProps) {
  const { text, locale } = ui
  const points = Math.max(...category.scale)
  const max = formatScore(toMilli(points), 'raw', config, locale)
  return (
    <>
      {category.icon !== undefined && (
        <CategoryIcon
          name={category.icon}
          className="size-6 shrink-0 text-[var(--category-color,currentColor)]"
        />
      )}
      <span>{category.label}</span>
      <span className="text-xs text-muted-foreground">
        {text('passage_category_max', { max, points })}
      </span>
    </>
  )
}
