import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StatsSectionProps = Readonly<{
  title: string
  /** Niveau du titre (`h2` par défaut). */
  as?: 'h2' | 'h3'
  /** Taille visuelle du titre, indépendante de son niveau (par défaut : celle de `as`). */
  size?: 'h2' | 'h3'
  /** Titre lu par les lecteurs d'écran seulement (« Chiffres clés » de la synthèse). */
  hideTitle?: boolean
  /** Avant le titre, sur sa ligne (icône de « À revoir »). */
  icon?: ReactNode
  /** Après le titre, poussé à droite (compteur de « À revoir »). */
  aside?: ReactNode
  /** Reçoit l'id du titre : un tableau s'y rattache par `aria-labelledby`. */
  children: (headingId: string) => ReactNode
  className?: string
}>

const TITLE_SIZE = { h2: 'text-h2', h3: 'text-h3' } as const

/** Bloc de l'écran : région nommée par son titre, en carte du design system. */
export function StatsSection({
  title,
  as: Heading = 'h2',
  size,
  hideTitle = false,
  icon,
  aside,
  children,
  className,
}: StatsSectionProps) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'flex flex-col gap-4 rounded-lg bg-card p-6 text-card-foreground shadow-card',
        className,
      )}
    >
      <div className={cn('flex items-center gap-2.5', hideTitle && 'contents')}>
        {icon}
        <Heading id={headingId} className={cn(TITLE_SIZE[size ?? Heading], hideTitle && 'sr-only')}>
          {title}
        </Heading>
        {aside !== undefined && <div className="ml-auto">{aside}</div>}
      </div>
      {children(headingId)}
    </section>
  )
}

/** Groupe de blocs (« Synthèse », « Détail ») : intertitre en capitales, sans carte. */
export function StatsGroup({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-label text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Indicateurs chiffrés d'une carte : libellé (`dt`) puis valeur (`dd`). */
export function StatFigures({ items }: Readonly<{ items: { label: string; value: string }[] }>) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-small text-muted-foreground">{label}</dt>
          <dd className="text-xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export type StatsColumn = { label: string; numeric?: boolean; srOnly?: boolean }

type StatsTableProps = Readonly<{
  labelledBy: string
  columns: StatsColumn[]
  children: ReactNode
}>

/** Tableau sémantique nommé par le titre du bloc ; la première colonne porte les en-têtes de ligne. */
export function StatsTable({ labelledBy, columns, children }: StatsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-labelledby={labelledBy} className="w-full">
        <thead>
          <tr>
            {columns.map(({ label, numeric, srOnly }) => (
              <th
                key={label}
                scope="col"
                className={cn(
                  'pr-3 pb-2 text-label text-muted-foreground uppercase last:pr-0',
                  numeric ? 'text-right whitespace-nowrap' : 'text-left',
                )}
              >
                {srOnly ? <span className="sr-only">{label}</span> : label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/** Classes d'une cellule : filet au-dessus, chiffres alignés à droite. */
export const CELL = 'border-t py-3 pr-3 align-middle last:pr-0'
export const NUMERIC_CELL = `${CELL} text-right font-semibold tabular-nums whitespace-nowrap`
export const ROW_HEADER = `${CELL} text-left font-medium`
