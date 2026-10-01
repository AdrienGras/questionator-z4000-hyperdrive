import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { REDUCED_MOTION_QUERY } from '@/lib/appearance/reduced-motion'
import { cn } from '@/lib/utils'

const SHUFFLE_MS = 1500
const CARDS = [0, 1, 2]

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/**
 * Révélation du tirage (F14), à monter avec `key={drawnAt}` : chaque tirage est un nouveau montage
 * qui décide seul. `animate` : trois cartes neutres (aucun texte, l'énoncé n'est pas dans le DOM)
 * se mélangent puis l'énoncé se retourne ; avec `prefers-reduced-motion`, un fondu remplace le
 * mélange. Sinon (ouverture, réouverture, animation coupée) l'énoncé s'affiche directement.
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
      <div className="flex min-h-48 items-center justify-center gap-6">
        {CARDS.map((index) => {
          const style: CSSProperties & Record<'--i', number> = {
            '--i': index,
            ...(color !== undefined && { backgroundColor: color }),
          }
          return (
            <div
              key={index}
              data-card
              aria-hidden="true"
              style={style}
              className={cn(
                'draw-card h-44 w-32 rounded-xl border-4 shadow-lg',
                !color && 'bg-primary',
              )}
            />
          )
        })}
      </div>
    )
  return (
    <div className={cn(animated && (reduced ? 'animate-in duration-300 fade-in' : 'draw-reveal'))}>
      {children}
    </div>
  )
}
