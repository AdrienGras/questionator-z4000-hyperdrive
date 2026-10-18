import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Géométrie des artboards `passage-note-finale` (`md`) et `projection-finale` (`lg`). */
const GEOMETRY = {
  md: { width: 320, height: 182, arc: 'M20 170 A140 140 0 0 1 300 170', stroke: 16, box: 'w-80' },
  lg: { width: 600, height: 300, arc: 'M30 285 A270 270 0 0 1 570 285', stroke: 30, box: 'w-150' },
} as const

/**
 * Demi-jauge de note (F44) : piste neutre et arc en dégradé d'action (`primary` → `action-to`,
 * dérivés du thème de la session), rempli au prorata de `ratio`, borné à [0, 1] ; sans note
 * (`undefined`), aucun arc. `children` (note, échelle) est posé en bas, au centre, caché aux
 * lecteurs d'écran : `label` dit la note en une phrase (oxlint refuse `role="img"`, comme
 * `SuccessRing`).
 */
export function ScoreGauge({
  ratio,
  size,
  label,
  children,
}: Readonly<{ ratio: number | undefined; size: 'md' | 'lg'; label: string; children: ReactNode }>) {
  const gradientId = useId()
  const { width, height, arc, stroke, box } = GEOMETRY[size]
  // Au dixième : 0,575 × 100 vaut 57,49999… en flottant.
  const percent =
    ratio === undefined ? undefined : Math.round(Math.min(1, Math.max(0, ratio)) * 1000) / 10
  return (
    <div className={cn('relative max-w-full', box)}>
      <span className="sr-only">{label}</span>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full"
        fill="none"
        strokeLinecap="round"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1">
            <stop offset="0" className="[stop-color:var(--color-primary)]" />
            <stop offset="1" className="[stop-color:var(--color-action-to)]" />
          </linearGradient>
        </defs>
        <path d={arc} className="stroke-muted" strokeWidth={stroke} />
        {percent !== undefined && (
          <path
            data-filled
            d={arc}
            pathLength={100}
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeDasharray={`${percent} 100`}
          />
        )}
      </svg>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        {children}
      </div>
    </div>
  )
}
