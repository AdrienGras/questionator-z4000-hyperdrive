import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Carte de l'aperçu de la création : libellé en capitales, puis contenu (artboard `creation-session`). */
export function PreviewCard({
  label,
  className,
  children,
}: Readonly<{ label: string; className?: string; children: ReactNode }>) {
  return (
    <section className={cn('flex flex-col gap-2 rounded-lg bg-card p-5 shadow-card', className)}>
      <span className="text-label text-muted-foreground uppercase">{label}</span>
      {children}
    </section>
  )
}

/** Chiffre clé suivi de son nom (« 11 étudiants », « 1 erreur à corriger »). */
export function PreviewFigure({
  value,
  noun,
  tone,
}: Readonly<{ value: number; noun: string; tone?: 'destructive' }>) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={cn('text-score-md tabular-nums', tone === 'destructive' && 'text-destructive')}
      >
        {value}
      </span>
      <span className="text-muted-foreground">{noun}</span>
    </div>
  )
}
