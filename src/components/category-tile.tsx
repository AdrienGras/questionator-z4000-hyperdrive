import type { CSSProperties } from 'react'
import { CategoryBadge } from '@/components/category-badge'
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

// Teinte de catégorie (D103) : fond à 10 % sur la carte, bordure à 35 %, neutre sans couleur ;
// classes écrites en entier (Tailwind ne lit que des littéraux). Type `color:` explicite : `cn`
// (tailwind-merge) les range avec les couleurs et retire celles du variant outline. `dark:` répété :
// sinon les classes `dark:` du variant l'emportent en sombre.
// Pas de `pointer-events-none` sur `aria-disabled` : le survol doit ouvrir l'infobulle d'une
// catégorie épuisée, le clic est neutralisé par l'appelant (QUIRKS).
const CATEGORY_TILE_BUTTON_CLASS =
  'flex h-full min-h-32 w-full flex-col items-center justify-center gap-2.5 rounded-xl p-4 ' +
  'text-center text-base whitespace-normal text-foreground hover:text-foreground ' +
  'border-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_35%,transparent)] ' +
  'dark:border-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_35%,transparent)] ' +
  'bg-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_10%,var(--color-card))] ' +
  'hover:bg-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_16%,var(--color-card))] ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-45'

/**
 * Props du bouton `outline` qui entoure une tuile : accent (`--category-color`), teinte de la
 * catégorie (neutre sans couleur), mise en page pleine hauteur. Communes au tirage d'un passage et
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
 * Contenu d'une tuile de catégorie : tuile d'icône teintée, libellé et maximum du barème en points,
 * dans la couleur de la catégorie. Le bouton qui l'entoure porte l'accent (`categoryAccent`) et l'état.
 */
export function CategoryTile({ ui, config, category }: CategoryTileProps) {
  const { text, locale } = ui
  const points = Math.max(...category.scale)
  const max = formatScore(toMilli(points), 'raw', config, locale)
  return (
    <>
      <CategoryBadge color={category.color} icon={category.icon} size="xl" />
      <span className="max-w-full font-bold wrap-anywhere">{category.label}</span>
      <span className="text-small font-semibold text-[var(--category-color,var(--color-muted-foreground))] tabular-nums">
        {text('passage_category_max', { max, points })}
      </span>
    </>
  )
}
