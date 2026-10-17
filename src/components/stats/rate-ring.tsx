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
  /** Taille (`size-26`, `size-24`). */
  className?: string
}>

/**
 * Anneau de réussite d'une catégorie (artboards `statistiques`, `entrainement-stats`) : arc teinté
 * par la catégorie, neutre sans couleur. Le dessin et la valeur sont cachés ; `label` les dit
 * (oxlint refuse `role="img"`).
 */
export function RateRing({ rate, value, label, caption, color, className }: RateRingProps) {
  const style: (CSSProperties & Record<'--category-color', string>) | undefined =
    color === undefined ? undefined : { '--category-color': color }
  const arc = rate === null ? null : Math.min(Math.max(rate, 0), 1) * CIRCUMFERENCE
  return (
    <span style={style} className={cn('relative inline-flex shrink-0', className)}>
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
        <span className="text-[1.375rem] leading-tight font-bold tabular-nums">{value}</span>
        <span className="text-label font-normal text-muted-foreground">{caption}</span>
      </span>
    </span>
  )
}
