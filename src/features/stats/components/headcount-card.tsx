import type { Headcount } from '@/domain/stats/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { StatFigures, StatsSection } from '@/components/stats/stats-section'

const figure = (label: string, value: number) => ({ label, value: String(value) })

/** Effectifs par statut ; les ajoutés en séance sont comptés tous statuts confondus. */
export function HeadcountCard({ ui, headcount }: Readonly<{ ui: Ui; headcount: Headcount }>) {
  const { text } = ui
  return (
    <StatsSection title={text('stats_headcount', {})}>
      {() => (
        <StatFigures
          items={[
            figure(text('stats_headcount_total', {}), headcount.total),
            figure(text('stats_headcount_done', {}), headcount.done),
            figure(text('stats_headcount_in_progress', {}), headcount.inProgress),
            figure(text('stats_headcount_todo', {}), headcount.todo),
            figure(text('stats_headcount_absent', {}), headcount.absent),
            figure(text('stats_headcount_added', {}), headcount.addedDuringSession),
          ]}
        />
      )}
    </StatsSection>
  )
}
