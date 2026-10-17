import { useId } from 'react'

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type SuccessRingProps = Readonly<{ rate: number | null; label: string }>

/**
 * Anneau du taux de réussite d'un entraînement (artboard `trainings`) : piste neutre, arc en
 * dégradé d'action, borné au cercle ; sans taux, la piste seule. Le dessin est caché, `label` le
 * dit aux lecteurs d'écran (oxlint refuse `role="img"`).
 */
export function SuccessRing({ rate, label }: SuccessRingProps) {
  const gradient = useId()
  const arc = rate === null ? null : Math.min(Math.max(rate, 0), 1) * CIRCUMFERENCE
  return (
    <span className="shrink-0">
      <span className="sr-only">{label}</span>
      <svg aria-hidden="true" viewBox="0 0 64 64" className="size-14 -rotate-90">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="[stop-color:var(--color-primary)]" />
            <stop offset="1" className="[stop-color:var(--color-action-to)]" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r={RADIUS} fill="none" strokeWidth="7" className="stroke-muted" />
        {arc !== null && (
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            stroke={`url(#${gradient})`}
            strokeDasharray={`${arc} ${CIRCUMFERENCE}`}
          />
        )}
      </svg>
    </span>
  )
}
