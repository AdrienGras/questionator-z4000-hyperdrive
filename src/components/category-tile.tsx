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

// `dark:` répété : sinon `dark:border-input` du variant outline l'emporte en sombre.
// Pas de `pointer-events-none` sur `aria-disabled` : le survol doit ouvrir l'infobulle d'une
// catégorie épuisée, le clic est neutralisé par l'appelant (QUIRKS).
const CATEGORY_TILE_BUTTON_CLASS =
  'flex h-full w-full flex-col items-center gap-2 p-4 text-center whitespace-normal ' +
  'data-[colored=true]:border-[var(--category-color)] ' +
  'dark:data-[colored=true]:border-[var(--category-color)] ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50'

/**
 * Props du bouton `outline` qui entoure une tuile : accent (`--category-color`), bordure teintée
 * si la catégorie a une couleur, mise en page pleine hauteur. Communes au tirage d'un passage et
 * d'un entraînement.
 */
export function categoryTileButtonProps(category: NormalizedCategory) {
  return {
    style: categoryAccent(category),
    'data-colored': category.color !== undefined,
    className: CATEGORY_TILE_BUTTON_CLASS,
  }
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
