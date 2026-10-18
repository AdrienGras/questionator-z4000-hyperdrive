import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatBound } from '@/domain/stats/labels'
import type { GradeStats, Headcount } from '@/domain/stats/types'
import { StatsSection } from '@/components/stats/stats-section'
import { formatDecimal } from '@/features/stats/format-stats'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type SynthesisCardProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  headcount: Headcount
  grades: GradeStats
}>

/** Statuts de la barre empilée, dans l'ordre du dessin, avec leur couleur (tokens). */
const STATUSES = [
  { status: 'done', field: 'done', color: 'bg-primary', legend: 'stats_legend_done' },
  {
    status: 'in-progress',
    field: 'inProgress',
    color: 'bg-foreground',
    legend: 'stats_legend_in_progress',
  },
  { status: 'todo', field: 'todo', color: 'bg-border', legend: 'stats_legend_todo' },
  { status: 'absent', field: 'absent', color: 'bg-input', legend: 'stats_legend_absent' },
] as const

/** Effectif : jamais suivi du barème. */
const count = (label: string, value: number) => ({ label, value: String(value), outOf: false })

/**
 * Synthèse de la session (artboard `statistiques`) : effectifs, moyenne et médiane sur le barème
 * final, puis la répartition par statut. La barre est décorative, sa légende écrit les effectifs.
 */
export function SynthesisCard({ ui, config, headcount, grades }: SynthesisCardProps) {
  const { text, locale } = ui
  const outOf = text('stats_out_of', { max: formatBound(config.scoring.finalScale, locale) })
  const score = (label: string, value: number | null) => ({
    label,
    value: formatDecimal(value, locale),
    outOf: value !== null,
  })
  const figures = [
    count(text('stats_headcount_total', {}), headcount.total),
    count(text('stats_headcount_done', {}), headcount.done),
    count(text('stats_headcount_absent', {}), headcount.absent),
    score(text('stats_grades_mean', {}), grades.mean),
    score(text('stats_grades_median', {}), grades.median),
  ]
  return (
    <StatsSection title={text('stats_headcount', {})} as="h3" hideTitle className="gap-5">
      {() => (
        <>
          <dl className="flex flex-wrap gap-x-6 gap-y-5">
            {figures.map((figure) => (
              <div key={figure.label} className="flex min-w-0 flex-[1_1_8.75rem] flex-col gap-1">
                <dt className="text-small text-muted-foreground">{figure.label}</dt>
                <dd className="flex items-baseline gap-1.5 text-score-md tabular-nums">
                  {figure.value}
                  {figure.outOf && (
                    <span className="text-body font-semibold tracking-normal text-muted-foreground">
                      {' '}
                      {outOf}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div
            aria-hidden="true"
            className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted"
          >
            {STATUSES.filter(({ field }) => headcount[field] > 0).map(
              ({ status, field, color }) => (
                <span
                  key={status}
                  data-status={status}
                  className={color}
                  style={{ width: `${(headcount[field] / headcount.total) * 100}%` }}
                />
              ),
            )}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-small text-muted-foreground tabular-nums">
            {STATUSES.map(({ status, field, color, legend }) => (
              <li key={status} className="inline-flex items-center gap-2">
                <span aria-hidden="true" className={cn('size-2.5 rounded-[3px]', color)} />
                {text(legend, { count: headcount[field] })}
              </li>
            ))}
            <li className="ml-auto">
              {text('stats_legend_added', { count: headcount.addedDuringSession })}
            </li>
          </ul>
        </>
      )}
    </StatsSection>
  )
}
