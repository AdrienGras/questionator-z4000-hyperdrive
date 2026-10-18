import { CategoryIcon } from '@/components/category-icon'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { findCategory } from '@/domain/config/lookup'
import { cn } from '@/lib/utils'
import { categoryAccent } from '@/lib/appearance/category-accent'

// Coupable n'importe où : un libellé de config n'a pas de longueur maximale (anneaux, « À revoir »).
const LABEL_CLASS =
  'inline-flex max-w-full items-center gap-1.5 text-small font-semibold wrap-anywhere'

/**
 * Libellé de catégorie teinté par sa couleur, avec son icône (artboards `statistiques`,
 * `entrainement-stats`) ; neutre sans couleur. Catégorie absente de la config : son id, neutre.
 */
export function CategoryLabel({
  config,
  categoryId,
  className,
}: Readonly<{ config: NormalizedConfig; categoryId: string; className?: string }>) {
  const category = findCategory(config, categoryId)
  if (category === undefined)
    return <span className={cn(LABEL_CLASS, 'text-muted-foreground', className)}>{categoryId}</span>
  const { color, icon } = category
  const accent = categoryAccent(color)
  return (
    <span
      style={accent}
      className={cn(
        LABEL_CLASS,
        'text-[var(--category-ink,var(--color-muted-foreground))]',
        className,
      )}
    >
      {icon !== undefined && <CategoryIcon name={icon} className="size-4 shrink-0" />}
      <span className="min-w-0">{category.label}</span>
    </span>
  )
}
