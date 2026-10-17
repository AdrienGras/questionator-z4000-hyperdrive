import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ActionHaloProps = Readonly<{
  /** `start` : bouton de formulaire, halo vers la gauche ; `end` : action d'en-tête, vers la droite. */
  side: 'start' | 'end'
  children: ReactNode
}>

/**
 * Halo flou derrière l'action principale d'un écran (token `halo-action`, un seul par écran) :
 * artboards `creation-session` (`start`) et `editeur-config` (`end`). Le débord éventuel sur
 * téléphone est coupé par la colonne de contenu de `RootLayout` (`overflow-x-clip`).
 */
export function ActionHalo({ side, children }: ActionHaloProps) {
  return (
    <div className="relative isolate self-start">
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -top-10 -z-10 h-32.5 bg-[radial-gradient(closest-side,var(--color-halo-action),transparent)] blur-sm',
          side === 'start' ? '-left-6 w-80' : '-right-6 w-100',
        )}
      />
      {children}
    </div>
  )
}
