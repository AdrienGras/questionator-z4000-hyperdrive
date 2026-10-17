import { useMemo } from 'react'
import { BackLink } from '@/components/back-link'
import { PageShell } from '@/components/page-shell'
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
import { StatsSection } from '@/components/stats/stats-section'
import { StrategyTable } from './strategy-table'
import { TagTable } from './tag-table'
import { StatsEmpty } from '@/components/stats/stats-empty'

/**
 * Écran des statistiques (F15) : barre de titre de la coque (`PageShell`), puis les blocs sur une colonne en mobile, en grille
 * au-delà. Appelé sous `SessionAppearance` : `useUi()` suit la langue de la config.
 */
export function StatsView({ session }: Readonly<{ session: Session }>) {
  const ui = useUi()
  const { text } = ui
  const { config } = session
  const stats = useMemo(() => computeStats(session), [session])
  return (
    <PageShell
      title={session.name}
      back={
        <BackLink to="/session/$sessionId" params={{ sessionId: session.id }}>
          {text('stats_back', {})}
        </BackLink>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <HeadcountCard ui={ui} headcount={stats.headcount} />
        <GradesCard ui={ui} config={config} grades={stats.grades} />
        <StatsSection title={text('stats_histogram', {})} className="md:col-span-2">
          {(headingId) => (
            <>
              {stats.grades.count === 0 ? (
                <StatsEmpty>{text('stats_histogram_empty', {})}</StatsEmpty>
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
    </PageShell>
  )
}
