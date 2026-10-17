import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { BackLink } from '@/components/back-link'
import { PageShell } from '@/components/page-shell'
import type { Session } from '@/domain/session/types'
import { computeStats } from '@/domain/stats/compute-stats'
import { useUi } from '@/lib/i18n/use-ui'
import { CategoryRings } from './category-rings'
import { GradesCard } from './grades-card'
import { QuestionTables } from './question-tables'
import { StatsGroup } from '@/components/stats/stats-section'
import { StatsEmptyState } from '@/components/stats/stats-empty-state'
import { buttonVariants } from '@/components/ui/button'
import { SynthesisCard } from './synthesis-card'
import { StrategyTable } from './strategy-table'
import { TagTable } from './tag-table'

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
            <div className="flex flex-wrap items-stretch gap-4">
              <GradesCard
                ui={ui}
                config={config}
                grades={stats.grades}
                histogram={stats.histogram}
                adjustments={stats.adjustments}
              />
              <CategoryRings ui={ui} config={config} categories={stats.categories} />
            </div>
          </StatsGroup>
          <StatsGroup title={text('stats_detail', {})}>
            <div className="flex flex-wrap items-stretch gap-4">
              <QuestionTables
                ui={ui}
                config={config}
                topDrawn={stats.topDrawn}
                skipped={stats.skipped}
              />
            </div>
            <div className="flex flex-wrap items-stretch gap-4">
              <StrategyTable ui={ui} config={config} strategies={stats.strategies} />
              <TagTable ui={ui} tags={stats.tags} />
            </div>
          </StatsGroup>
        </>
      )}
    </PageShell>
  )
}
