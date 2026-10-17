import type { CSSProperties } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import { cn } from '@/lib/utils'

type BadgeSize = 'sm' | 'md' | 'lg' | 'xl' | 'projection-sm' | 'projection-lg'

/** Boîte, rayon, icône et point de chaque taille (classes littérales pour Tailwind). */
const SIZES: Record<BadgeSize, { box: string; icon: string; dot: string }> = {
  sm: { box: 'size-7 rounded-sm', icon: 'size-4', dot: 'size-2' },
  md: { box: 'size-8 rounded-[10px]', icon: 'size-4.5', dot: 'size-2.5' },
  lg: { box: 'size-9 rounded-md', icon: 'size-5', dot: 'size-3' },
  xl: { box: 'size-10 rounded-md', icon: 'size-5.5', dot: 'size-3' },
  'projection-sm': { box: 'size-11 rounded-md', icon: 'size-6.5', dot: 'size-3.5' },
  'projection-lg': { box: 'size-18 rounded-[18px]', icon: 'size-10', dot: 'size-6' },
}

/**
 * Tuile d'icône d'une catégorie, teintée par sa couleur (D103 : fond à 16 %), neutre sans couleur.
 * Icône de la config si elle existe, sinon un point. Décorative : le libellé est toujours à côté.
 */
export function CategoryBadge({
  color,
  icon,
  size,
  className,
}: Readonly<{ color?: string; icon?: string; size: BadgeSize; className?: string }>) {
  const style: (CSSProperties & Record<'--category-color', string>) | undefined =
    color === undefined ? undefined : { '--category-color': color }
  const classes = SIZES[size]
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        'bg-[color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_16%,transparent)]',
        'text-[var(--category-color,var(--color-muted-foreground))]',
        classes.box,
        className,
      )}
    >
      {icon === undefined ? (
        <span data-dot className={cn('rounded-full bg-current', classes.dot)} />
      ) : (
        <CategoryIcon name={icon} className={cn('shrink-0', classes.icon)} />
      )}
    </span>
  )
}
