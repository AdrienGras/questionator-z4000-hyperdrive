import { useId, type ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type StatsSectionProps = Readonly<{
  title: string
  /** Reçoit l'id du titre : un tableau s'y rattache par `aria-labelledby`. */
  children: (headingId: string) => ReactNode
  className?: string
}>

/** Bloc de l'écran : région nommée par son titre `h2`, en carte. */
export function StatsSection({ title, children, className }: StatsSectionProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={className}>
      <Card className="h-full">
        <CardHeader>
          <h2 id={headingId} className="text-base font-medium">
            {title}
          </h2>
        </CardHeader>
        <CardContent>{children(headingId)}</CardContent>
      </Card>
    </section>
  )
}

/** Indicateurs chiffrés d'une carte : libellé (`dt`) puis valeur (`dd`). */
export function StatFigures({ items }: Readonly<{ items: { label: string; value: string }[] }>) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export type StatsColumn = { label: string; numeric?: boolean }

type StatsTableProps = Readonly<{
  labelledBy: string
  columns: StatsColumn[]
  children: ReactNode
}>

/** Tableau sémantique nommé par le titre du bloc ; la première colonne porte les en-têtes de ligne. */
export function StatsTable({ labelledBy, columns, children }: StatsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-labelledby={labelledBy} className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            {columns.map(({ label, numeric }) => (
              <th
                key={label}
                scope="col"
                className={`py-1.5 pr-3 font-medium last:pr-0 ${numeric ? 'text-right' : 'text-left'}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/** Classes d'une cellule : chiffres alignés à droite. */
export const CELL = 'py-1.5 pr-3 align-top last:pr-0'
export const NUMERIC_CELL = `${CELL} text-right tabular-nums`
export const ROW_HEADER = `${CELL} text-left font-normal`
