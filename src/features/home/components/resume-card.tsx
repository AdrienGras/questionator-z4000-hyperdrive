import type { ReactNode } from 'react'
import { SpaceIcon, type Space } from '@/components/space-icon'

type ResumeCardProps = Readonly<{
  space: Space
  kind: string
  date: string
  title: string
  subtitle?: ReactNode
  children?: ReactNode
  actions: ReactNode
}>

export const SMALL_MUTED_CLASS = 'text-[13px] leading-[18px] text-muted-foreground'

/**
 * Carte de la section « Reprendre » (artboard `accueil`) : type, date courte, titre, état, liens.
 * Quatre lignes prises dans la grille de la section (`subgrid`) : d'une carte à l'autre, l'état et
 * les liens commencent à la même hauteur, sous-titre ou non.
 */
export function ResumeCard({
  space,
  kind,
  date,
  title,
  subtitle,
  children,
  actions,
}: ResumeCardProps) {
  return (
    <article className="row-span-4 grid grid-rows-subgrid gap-3.5 rounded-xl bg-card p-5 shadow-card">
      <div className="flex items-center gap-2.5">
        <SpaceIcon space={space} size="sm" />
        <span className="text-label text-muted-foreground uppercase">{kind}</span>
        <span className={`ml-auto whitespace-nowrap tabular-nums ${SMALL_MUTED_CLASS}`}>
          {date}
        </span>
      </div>
      <div>
        <h3 className="text-h3 wrap-anywhere">{title}</h3>
        {subtitle !== undefined && (
          <p className={`tabular-nums ${SMALL_MUTED_CLASS}`}>{subtitle}</p>
        )}
      </div>
      {/* Toujours rendu : chaque carte garde ses quatre lignes. */}
      <div>{children}</div>
      <div className="flex flex-wrap gap-1 pt-1">{actions}</div>
    </article>
  )
}
