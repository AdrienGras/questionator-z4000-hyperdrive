import { useState } from 'react'
import { Markdown } from '@/components/markdown/markdown'
import { CategoryTiles } from '@/components/projection/category-tiles'
import { DrawReveal } from '@/components/projection/draw-reveal'
import { FinalCard } from '@/components/projection/final-card'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import { useUi, type Ui } from '@/lib/i18n/use-ui'

/** Bas d'écran : progression en cours de passage, « Passage terminé » ou note finale une fois terminé. */
function Progress({ ui, view }: Readonly<{ ui: Ui; view: ProjectedStudentView }>) {
  if (!view.finished) {
    return (
      <p className="text-2xl text-muted-foreground">
        {ui.text('present_question_index', view.questionIndex)}
      </p>
    )
  }
  if (view.final === undefined) {
    return <p className="text-4xl font-semibold">{ui.text('present_finished', {})}</p>
  }
  return <FinalCard ui={ui} final={view.final} detail={view.detail} />
}

/** Écran étudiant de la vue projetée : nom, catégories, énoncé en cours, progression, note finale. */
export function StudentScreen({
  view,
  animate = true,
}: Readonly<{ view: ProjectedStudentView; animate?: boolean }>) {
  const ui = useUi()
  // `drawnAt` présent au montage (ouverture, réouverture, changement d'étudiant) : jamais animé.
  const [initialDrawnAt] = useState(view.current?.drawnAt)
  const format = new Intl.NumberFormat(ui.locale, { maximumFractionDigits: 2 })
  const { student, current, cumulativeRaw } = view
  return (
    <div className="flex flex-1 flex-col gap-8 p-6 @min-[40rem]:p-10">
      <header className="flex flex-col gap-1">
        <p className="text-xl text-muted-foreground">{view.examTitle}</p>
        <h1 className="text-5xl font-bold tracking-tight">
          {student.firstName} {student.lastName}
        </h1>
      </header>
      <CategoryTiles
        ui={ui}
        categories={view.categories}
        currentCategoryId={current?.categoryId}
        finished={view.finished}
      />
      {current !== undefined && (
        <DrawReveal
          key={current.drawnAt}
          color={view.categories.find((category) => category.id === current.categoryId)?.color}
          animate={animate && view.drawAnimation && current.drawnAt !== initialDrawnAt}
        >
          {/* `wrap-anywhere` : un mot sans espace coupe au lieu d'élargir l'écran (#118). */}
          <section aria-label={ui.text('present_prompt_label', {})} className="wrap-anywhere">
            <Markdown source={current.prompt} ui={ui} size="projection" />
          </section>
        </DrawReveal>
      )}
      <Progress ui={ui} view={view} />
      {cumulativeRaw !== undefined && (
        <p className="text-2xl">
          {ui.text('present_cumulative', { score: format.format(cumulativeRaw) })}
        </p>
      )}
    </div>
  )
}
