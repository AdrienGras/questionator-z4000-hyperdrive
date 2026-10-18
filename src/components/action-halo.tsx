import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ActionHaloProps = Readonly<{
  /**
   * `start` : bouton de formulaire, halo vers la gauche ; `end` : action d'en-tête, vers la droite ;
   * `around` : carte pleine largeur, halo sur les quatre côtés.
   */
  side: 'start' | 'end' | 'around'
  children: ReactNode
}>

/**
 * Halo flou derrière l'action principale d'un écran (token `halo-action`, un seul par écran) :
 * artboards `creation-session` (`start`), `editeur-config` (`end`) et `passage-question` (`around`,
 * carte « Note »). Le débord éventuel sur
 * téléphone est coupé par la colonne de contenu de `RootLayout` (`overflow-x-clip`).
 */
export function ActionHalo({ side, children }: ActionHaloProps) {
  return (
    <div className={cn('relative isolate', side !== 'around' && 'self-start')}>
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -z-10 blur-sm',
          side === 'around'
            ? '-inset-8 bg-[radial-gradient(closest-side,var(--color-halo-action),var(--color-halo-action)_55%,transparent)]'
            : 'bg-[radial-gradient(closest-side,var(--color-halo-action),transparent)] -top-10 h-32.5',
          side === 'start' && '-left-6 w-80',
          side === 'end' && '-right-6 w-100',
        )}
      />
      {children}
    </div>
  )
}
