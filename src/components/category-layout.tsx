import type { CSSProperties, ReactNode } from 'react'
import { categoryRows } from '@/domain/presentation/category-rows'
import { cn } from '@/lib/utils'

type CategoryLayoutProps<T> = Readonly<{
  items: readonly T[]
  itemKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  className?: string
  'aria-label'?: string
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

/**
 * Disposition des tuiles de catégorie, commune à la vue examinateur et à la vue projetée (F25,
 * D74) : grille de deux colonnes par tuile, `c` tuiles sur les lignes longues, tuiles de même
 * largeur partout. Une seule colonne sous `sm`.
 */
export function CategoryLayout<T>({
  items,
  itemKey,
  renderItem,
  className,
  'aria-label': ariaLabel,
}: CategoryLayoutProps<T>) {
  const rows = categoryRows(items.length)
  const starts = shortRowStarts(rows)
  const style: CSSProperties & Record<'--cols', string> = { '--cols': String(2 * (rows[0] ?? 1)) }

  return (
    <ul
      aria-label={ariaLabel}
      style={style}
      className={cn('grid grid-cols-1 sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))]', className)}
    >
      {items.map((item, index) => (
        <li
          key={itemKey(item)}
          data-row-start={starts.has(index)}
          className="sm:col-span-2 sm:data-[row-start=true]:col-start-2"
        >
          {renderItem(item)}
        </li>
      ))}
    </ul>
  )
}
