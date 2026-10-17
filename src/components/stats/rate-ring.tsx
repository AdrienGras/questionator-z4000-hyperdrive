import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

const RADIUS = 58
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type RateRingProps = Readonly<{
  /** Taux entre 0 et 1, borné au cercle ; `null` : piste seule. */
  rate: number | null
  /** Taux formaté, au centre (« 83,3 % », « — »). */
  value: string
  /** Phrase lue par les lecteurs d'écran (« Réussite Facile : 83,3 % »). */
  label: string
  /** Légende sous la valeur (« réussite »). */
  caption: string
  color?: string
  /** `lg` : statistiques de session (104 px) ; `md` : stats d'entraînement (96 px). */
  size: 'md' | 'lg'
}>

/** Boîte et taille de la valeur centrale par taille (classes littérales pour Tailwind). */
const SIZES = {
  md: { box: 'size-24', value: 'text-xl' },
  lg: { box: 'size-26', value: 'text-[1.375rem]' },
} as const

/**
 * Anneau de réussite d'une catégorie (artboards `statistiques`, `entrainement-stats`) : arc teinté
 * par la catégorie, neutre sans couleur. Le dessin et la valeur sont cachés ; `label` les dit
 * (oxlint refuse `role="img"`).
 */
export function RateRing({ rate, value, label, caption, color, size }: RateRingProps) {
  const style: (CSSProperties & Record<'--category-color', string>) | undefined =
    color === undefined ? undefined : { '--category-color': color }
  // Un arc nul n'est pas dessiné : son bout arrondi laisserait un point de couleur.
  const arc = rate === null || rate <= 0 ? null : Math.min(rate, 1) * CIRCUMFERENCE
  return (
    <span style={style} className={cn('relative inline-flex shrink-0', SIZES[size].box)}>
      <span className="sr-only">{label}</span>
      <svg aria-hidden="true" viewBox="0 0 140 140" className="size-full -rotate-90">
        <circle cx="70" cy="70" r={RADIUS} fill="none" strokeWidth="12" className="stroke-muted" />
        {arc !== null && (
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arc} ${CIRCUMFERENCE}`}
            className="stroke-[var(--category-color,var(--color-muted-foreground))]"
          />
        )}
      </svg>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className={cn(SIZES[size].value, 'leading-tight font-bold tabular-nums')}>
          {value}
        </span>
        <span className="text-label font-normal text-muted-foreground">{caption}</span>
      </span>
    </span>
  )
}
