import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { BackLink } from '@/components/back-link'
import { PageShell } from '@/components/page-shell'
import type { Session } from '@/domain/session/types'
import { computeStats } from '@/domain/stats/compute-stats'
import { useUi } from '@/lib/i18n/use-ui'
import { AdjustmentCard } from './adjustment-card'
import { CategoryTable } from './category-table'
import { GradesCard } from './grades-card'
import { HistogramChart } from './histogram-chart'
import { HistogramTable } from './histogram-table'
import { QuestionTables } from './question-tables'
import { StatsGroup, StatsSection } from '@/components/stats/stats-section'
import { StatsEmptyState } from '@/components/stats/stats-empty-state'
import { buttonVariants } from '@/components/ui/button'
import { SynthesisCard } from './synthesis-card'
import { StrategyTable } from './strategy-table'
import { TagTable } from './tag-table'
import { StatsEmpty } from '@/components/stats/stats-empty'

/** Aucun étudiant n'a de tentative : rien à compter, l'écran montre son état vide (D103). */
const hasNoAttempt = (session: Session) => session.students.every((s) => s.attempts.length === 0)

/**
 * Écran des statistiques (F15, artboards `statistiques` et `stats-vide`) : barre de titre de la
 * coque (`PageShell`), puis « Synthèse » et « Détail ». Appelé sous `SessionAppearance` : `useUi()`
 * suit la langue de la config.
 */
export function StatsView({ session }: Readonly<{ session: Session }>) {
  const ui = useUi()
  const { text } = ui
  const { config } = session
  const stats = useMemo(() => computeStats(session), [session])
  const { exam } = config
  const meta = [text('stats_kicker', {}), exam.title, exam.subject, exam.cohort]
    .filter((part) => part !== undefined)
    .join(' · ')
  return (
    <PageShell
      title={session.name}
      meta={meta}
      back={
        <BackLink to="/session/$sessionId" params={{ sessionId: session.id }}>
          {text('stats_back', {})}
        </BackLink>
      }
    >
      {hasNoAttempt(session) ? (
        <StatsEmptyState
          title={text('stats_empty_title', {})}
          body={text('stats_empty_body', {})}
          action={
            <Link
              to="/session/$sessionId"
              params={{ sessionId: session.id }}
              className={buttonVariants()}
            >
              {text('stats_empty_action', {})}
            </Link>
          }
        />
      ) : (
        <>
          <StatsGroup title={text('stats_synthesis', {})}>
            <SynthesisCard
              ui={ui}
              config={config}
              headcount={stats.headcount}
              grades={stats.grades}
            />
          </StatsGroup>
          <div className="grid gap-4 md:grid-cols-2">
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
            <QuestionTables
              ui={ui}
              config={config}
              topDrawn={stats.topDrawn}
              skipped={stats.skipped}
            />
            <StrategyTable ui={ui} config={config} strategies={stats.strategies} />
            <AdjustmentCard ui={ui} config={config} adjustments={stats.adjustments} />
          </div>
        </>
      )}
    </PageShell>
  )
}
