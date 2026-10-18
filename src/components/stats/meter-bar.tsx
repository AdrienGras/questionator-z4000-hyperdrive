import { cn } from '@/lib/utils'
import { categoryAccent } from '@/lib/appearance/category-accent'

type MeterBarProps = Readonly<{
  /** Taux entre 0 et 1, borné au dessin ; `null` : piste seule. */
  value: number | null
  /** `primary` : couleur d'action ; `category` : teinte de la catégorie, neutre sans couleur. */
  tone: 'primary' | 'category'
  color?: string
  /** Dégradé d'action (couverture d'un entraînement), avec `tone="primary"`. */
  gradient?: boolean
  /** Largeur et hauteur (`w-24`, `h-2`…). */
  className?: string
}>

/** Couleur du remplissage : teinte de la catégorie, dégradé d'action ou aplat d'action. */
function fillClass(tone: MeterBarProps['tone'], gradient: boolean): string {
  if (tone === 'category') return 'bg-[var(--category-ink,var(--color-muted-foreground))]'
  return gradient ? 'bg-primary bg-linear-90 from-primary to-action-to' : 'bg-primary'
}

/**
 * Barre horizontale d'un taux (artboards `statistiques`, `entrainement-stats`). Décorative : le
 * taux est toujours écrit à côté (oxlint refuse `role="img"`).
 */
export function MeterBar({ value, tone, color, gradient = false, className }: MeterBarProps) {
  const style = tone === 'category' ? categoryAccent(color) : undefined
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn('block h-1.5 overflow-hidden rounded-full bg-muted', className)}
    >
      {value !== null && (
        <span
          style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
          className={cn('block h-full rounded-full', fillClass(tone, gradient))}
        />
      )}
    </span>
  )
}
