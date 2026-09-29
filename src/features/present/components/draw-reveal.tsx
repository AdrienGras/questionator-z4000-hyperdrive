import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const SHUFFLE_MS = 1500
const CARDS = [0, 1, 2]

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Révélation du tirage (F14). Le `drawnAt` du premier rendu est retenu : énoncé direct (ouverture,
 * réouverture, changement d'étudiant). Un `drawnAt` différent reçu ensuite, avec `animate`, montre
 * trois cartes neutres (aucun texte, l'énoncé n'est pas dans le DOM) puis l'énoncé. Avec
 * `prefers-reduced-motion`, un fondu remplace le mélange.
 */
export function DrawReveal({
  drawnAt,
  color,
  animate,
  children,
}: Readonly<{ drawnAt: string; color?: string; animate: boolean; children: ReactNode }>) {
  const [initial] = useState(drawnAt)
  const [revealedFor, setRevealedFor] = useState(drawnAt)
  const fresh = animate && drawnAt !== initial
  const reduced = fresh && prefersReducedMotion()
  const shuffling = fresh && !reduced && revealedFor !== drawnAt

  useEffect(() => {
    if (!shuffling) return undefined
    const timer = setTimeout(() => setRevealedFor(drawnAt), SHUFFLE_MS)
    return () => clearTimeout(timer)
  }, [shuffling, drawnAt])

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
    <div className={cn(fresh && (reduced ? 'animate-in duration-300 fade-in' : 'draw-reveal'))}>
      {children}
    </div>
  )
}
