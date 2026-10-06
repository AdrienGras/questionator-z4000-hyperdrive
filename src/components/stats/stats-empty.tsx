import type { ReactNode } from 'react'

/** Phrase d'état vide d'un bloc de statistiques, à la place de son tableau ou de son graphique. */
export function StatsEmpty({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-muted-foreground">{children}</p>
}
