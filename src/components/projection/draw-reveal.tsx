import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { REDUCED_MOTION_QUERY } from '@/lib/appearance/reduced-motion'
import { cn } from '@/lib/utils'

const SHUFFLE_MS = 1500
const CARDS = [0, 1, 2]

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/**
 * Révélation du tirage (F14, artboard `projection-tirage`), à monter avec `key={drawnAt}` : chaque
 * tirage est un nouveau montage qui décide seul. `animate` : trois cartes teintées de la catégorie
 * (aucun texte, l'énoncé n'est pas dans le DOM) se mélangent puis l'énoncé se retourne ; avec
 * `prefers-reduced-motion`, un fondu remplace le mélange. Sinon (ouverture, réouverture, animation coupée) l'énoncé s'affiche directement.
 * `animate` est figé au montage : basculer `drawAnimation` pendant une question ne rejoue rien.
 */
export function DrawReveal({
  color,
  animate,
  children,
}: Readonly<{ color?: string; animate: boolean; children: ReactNode }>) {
  const [animated] = useState(animate)
  const [reduced] = useState(() => animated && prefersReducedMotion())
  const [done, setDone] = useState(false)
  const shuffling = animated && !reduced && !done

  useEffect(() => {
    if (!shuffling) return undefined
    const timer = setTimeout(() => setDone(true), SHUFFLE_MS)
    return () => clearTimeout(timer)
  }, [shuffling])

  if (shuffling)
    return (
      <div className="flex min-h-72 flex-1 items-center justify-center gap-10">
        {CARDS.map((index) => {
          const style: CSSProperties &
            Record<'--i', number> &
            Partial<Record<'--category-color', string>> = {
            '--i': index,
            ...(color !== undefined && { '--category-color': color }),
          }
          return (
            <div
              key={index}
              data-card
              aria-hidden="true"
              style={style}
              className={cn(
                'draw-card flex h-70 w-50 items-center justify-center rounded-xl border-[1.5px] shadow-popover',
                'border-[color:color-mix(in_oklch,var(--category-color,var(--color-primary))_45%,transparent)]',
                'bg-[color:color-mix(in_oklch,var(--category-color,var(--color-primary))_12%,var(--color-card))]',
              )}
            >
              <span className="size-18 rounded-[22px] bg-linear-135 from-primary to-action-to opacity-90" />
            </div>
          )
        })}
      </div>
    )
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        animated && (reduced ? 'animate-in duration-300 fade-in' : 'draw-reveal'),
      )}
    >
      {children}
    </div>
  )
}
