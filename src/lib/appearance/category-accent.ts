import type { CSSProperties } from 'react'

/** Style d'un élément teinté par une catégorie : couleur brute et encre (D26, D112). */
export type CategoryAccent = CSSProperties & Record<'--category-color' | '--category-ink', string>

/**
 * Couleur d'une catégorie de la config, posée en variables sur l'élément (`setProperty`, D15).
 * `--category-color` sert aux teintes (fonds, bordures à 35 %) ; `--category-ink` aux usages pleins
 * (texte, icône, trait, barre), foncée en clair par `--category-ink-mix` (60 % de la couleur, le
 * reste en noir) et égale à la couleur en sombre (100 %). Sans couleur, aucun style : les classes
 * retombent sur leur repli neutre.
 */
export function categoryAccent(color: string | undefined): CategoryAccent | undefined {
  if (color === undefined) return undefined
  return {
    '--category-color': color,
    '--category-ink': `color-mix(in oklch, ${color} var(--category-ink-mix), black)`,
  }
}
