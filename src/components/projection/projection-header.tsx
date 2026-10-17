import { IconCheck } from '@tabler/icons-react'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import { formatRawScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Ui } from '@/lib/i18n/use-ui'

function StatCard({ term, value }: Readonly<{ term: string; value: string }>) {
  return (
    <div className="min-w-37 rounded-lg bg-card px-5.5 py-3.5 shadow-card">
      <dt className="text-sm font-semibold tracking-[.06em] text-muted-foreground uppercase">
        {term}
      </dt>
      <dd className="mt-1 text-[2.5rem] leading-11 font-bold tracking-[-0.02em] tabular-nums">
        {value}
      </dd>
    </div>
  )
}

/**
 * En-tête de l'écran étudiant projeté (artboards `projection-*`) : titre de l'épreuve, nom, puis
 * en haut à droite les cartes « Question » et « Score » (score brut cumulé, si la config l'affiche) ;
 * une fois le passage fini, la pastille « Passage terminé » à leur place. `pr-14` : place du bouton
 * plein écran.
 */
export function ProjectionHeader({ ui, view }: Readonly<{ ui: Ui; view: ProjectedStudentView }>) {
  const { student, questionIndex, cumulativeRaw } = view
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pr-14">
      <div className="min-w-0">
        <p className="text-[1.375rem] leading-7 font-medium text-muted-foreground">
          {view.examTitle}
        </p>
        <h1 className="mt-1.5 text-[4rem] leading-none font-extrabold tracking-[-0.03em] wrap-anywhere">
          {student.firstName} {student.lastName}
        </h1>
      </div>
      {view.finished ? (
        <p className="inline-flex h-13 items-center gap-2.5 rounded-full bg-card px-5.5 text-[1.375rem] font-semibold text-muted-foreground shadow-card">
          <IconCheck aria-hidden className="size-6 text-space-training" />
          {ui.text('present_finished', {})}
        </p>
      ) : (
        <dl className="flex gap-4">
          <StatCard
            term={ui.text('present_question_label', {})}
            value={`${questionIndex.current} / ${questionIndex.total}`}
          />
          {cumulativeRaw !== undefined && (
            <StatCard
              term={ui.text('present_score_label', {})}
              value={formatRawScore(toMilli(cumulativeRaw), ui.locale)}
            />
          )}
        </dl>
      )}
    </header>
  )
}
