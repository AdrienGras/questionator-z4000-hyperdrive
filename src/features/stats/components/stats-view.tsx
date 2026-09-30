import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { ColorModeToggle } from '@/components/color-mode-toggle'
import { buttonVariants } from '@/components/ui/button'
import type { Session } from '@/domain/session/types'
import { computeStats } from '@/domain/stats/compute-stats'
import { useUi } from '@/lib/i18n/use-ui'
import { AdjustmentCard } from './adjustment-card'
import { CategoryTable } from './category-table'
import { GradesCard } from './grades-card'
import { HeadcountCard } from './headcount-card'
import { HistogramChart } from './histogram-chart'
import { HistogramTable } from './histogram-table'
import { QuestionTables } from './question-tables'
import { StatsSection } from './stats-section'
import { StrategyTable } from './strategy-table'
import { TagTable } from './tag-table'

/**
 * Écran des statistiques (F15) : en-tête, puis les blocs sur une colonne en mobile, en grille
 * au-delà. Appelé sous `SessionAppearance` : `useUi()` suit la langue de la config.
 */
export function StatsView({ session }: Readonly<{ session: Session }>) {
  const ui = useUi()
  const { text } = ui
  const { config } = session
  const stats = useMemo(() => computeStats(session), [session])
  return (
    <main className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            to="/session/$sessionId"
            params={{ sessionId: session.id }}
            className={buttonVariants({ variant: 'outline', className: 'self-start' })}
          >
            {text('stats_back', {})}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
        </div>
        <ColorModeToggle ui={ui} />
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <HeadcountCard ui={ui} headcount={stats.headcount} />
        <GradesCard ui={ui} config={config} grades={stats.grades} />
        <StatsSection title={text('stats_histogram', {})} className="md:col-span-2">
          {(headingId) => (
            <>
              {stats.grades.count === 0 ? (
                <p className="text-muted-foreground">{text('stats_histogram_empty', {})}</p>
              ) : (
                <HistogramChart ui={ui} bins={stats.histogram} />
              )}
              <HistogramTable ui={ui} bins={stats.histogram} labelledBy={headingId} />
            </>
          )}
        </StatsSection>
        <CategoryTable ui={ui} config={config} categories={stats.categories} />
        <TagTable ui={ui} tags={stats.tags} />
        <QuestionTables ui={ui} config={config} topDrawn={stats.topDrawn} skipped={stats.skipped} />
        <StrategyTable ui={ui} config={config} strategies={stats.strategies} />
        <AdjustmentCard ui={ui} config={config} adjustments={stats.adjustments} />
      </div>
    </main>
  )
}
