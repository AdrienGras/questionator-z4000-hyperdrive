import type { CSSProperties } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { findCategory } from '@/features/stats/config-lookup'
import { cn } from '@/lib/utils'

/**
 * Libellé de catégorie avec sa couleur et son icône en accent (liseré, icône ; jamais en fond sous
 * le texte, D26). Catégorie absente de la config : son id, sans accent.
 */
export function CategoryLabel({
  config,
  categoryId,
}: Readonly<{ config: NormalizedConfig; categoryId: string }>) {
  const category = findCategory(config, categoryId)
  if (category === undefined) return <span>{categoryId}</span>
  const { color, icon } = category
  const accent: (CSSProperties & Record<'--category-color', string>) | undefined =
    color === undefined ? undefined : { '--category-color': color }
  return (
    <span
      style={accent}
      className={cn(
        'inline-flex items-center gap-1.5',
        color !== undefined && 'border-l-4 border-[var(--category-color)] pl-1.5',
      )}
    >
      {icon !== undefined && (
        <CategoryIcon
          name={icon}
          className="size-4 shrink-0 text-[var(--category-color,currentColor)]"
        />
      )}
      <span>{category.label}</span>
    </span>
  )
}
