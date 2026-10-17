import type { CSSProperties, ReactNode } from 'react'
import { categoryRows } from '@/domain/presentation/category-rows'
import { cn } from '@/lib/utils'

type CategoryLayoutProps<T> = Readonly<{
  items: readonly T[]
  itemKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  className?: string
  /**
   * Largeur de conteneur sous laquelle les tuiles passent sur une colonne : `wide` (40rem, défaut,
   * vue projetée et son aperçu), `narrow` (30rem, grille de l'examinateur à côté de sa colonne de
   * droite, D108).
   */
  threshold?: 'wide' | 'narrow'
  'aria-label'?: string
  'aria-labelledby'?: string
}>

/**
 * Indices des premières tuiles des lignes courtes. Elles n'ont qu'une tuile de moins que les
 * longues (`categoryRows`) : les faire démarrer à la 2e demi-colonne les centre exactement.
 */
function shortRowStarts(rows: readonly number[]): Set<number> {
  const starts = new Set<number>()
  let index = 0
  for (const size of rows) {
    if (size < (rows[0] ?? 0)) starts.add(index)
    index += size
  }
  return starts
}

// Classes écrites en entier (Tailwind ne lit que des littéraux).
const GRID = {
  wide: '@min-[40rem]:grid-cols-[repeat(var(--cols),minmax(0,1fr))]',
  narrow: '@min-[30rem]:grid-cols-[repeat(var(--cols),minmax(0,1fr))]',
} as const
const ITEM = {
  wide: '@min-[40rem]:col-span-2 @min-[40rem]:data-[row-start=true]:col-start-2',
  narrow: '@min-[30rem]:col-span-2 @min-[30rem]:data-[row-start=true]:col-start-2',
} as const

/**
 * Disposition des tuiles de catégorie, commune à la vue examinateur et à la vue projetée (F25,
 * D74) : grille de deux colonnes par tuile, `c` tuiles sur les lignes longues, tuiles de même
 * largeur partout. Une seule colonne sous 40rem de conteneur (30rem en `narrow`)
 * (container query : la vue projetée peut être rendue dans un canvas réduit).
 */
export function CategoryLayout<T>({
  items,
  itemKey,
  renderItem,
  className,
  threshold = 'wide',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: CategoryLayoutProps<T>) {
  const rows = categoryRows(items.length)
  const starts = shortRowStarts(rows)
  const style: CSSProperties & Record<'--cols', string> = { '--cols': String(2 * (rows[0] ?? 1)) }

  return (
    <div className="@container">
      <ul
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        style={style}
        className={cn('grid grid-cols-1', GRID[threshold], className)}
      >
        {items.map((item, index) => (
          <li key={itemKey(item)} data-row-start={starts.has(index)} className={ITEM[threshold]}>
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </div>
  )
}
