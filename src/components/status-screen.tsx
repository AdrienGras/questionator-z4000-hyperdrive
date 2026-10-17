import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** `main` plein écran centré des écrans d'état, partagé avec le chargement d'une session. */
export const STATUS_MAIN_CLASS =
  'flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center'

type StatusScreenProps = Readonly<{
  icon: ReactNode
  tone?: 'neutral' | 'danger'
  title: ReactNode
  children?: ReactNode
}>

/**
 * Écran d'état rendu à la place d'une page (artboard `bandeaux`) : tuile d'icône, titre, puis ce
 * que l'écran propose. Session introuvable ou endommagée, entraînement endommagé, 404.
 */
export function StatusScreen({ icon, tone = 'neutral', title, children }: StatusScreenProps) {
  return (
    <main className={STATUS_MAIN_CLASS}>
      <span
        aria-hidden
        className={cn(
          'inline-flex size-14 shrink-0 items-center justify-center rounded-md [&>svg]:size-7',
          tone === 'danger'
            ? 'bg-destructive/14 text-destructive'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </main>
  )
}
