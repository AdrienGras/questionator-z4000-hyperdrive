import { useState } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import { Markdown } from '@/components/markdown/markdown'
import { CategoryTiles } from '@/components/projection/category-tiles'
import { DrawReveal } from '@/components/projection/draw-reveal'
import { FinalCard } from '@/components/projection/final-card'
import { ProjectionHeader } from '@/components/projection/projection-header'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import { formatRawScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import { useUi, type Ui } from '@/lib/i18n/use-ui'
import { categoryAccent } from '@/lib/appearance/category-accent'

/** Note finale une fois révélée ; sinon rien (la pastille de l'en-tête dit « Passage terminé »). */
function Final({ ui, view }: Readonly<{ ui: Ui; view: ProjectedStudentView }>) {
  if (view.final === undefined) return null
  return <FinalCard ui={ui} final={view.final} detail={view.detail} categories={view.categories} />
}

/** En-tête « catégorie · points » de la question projetée, dans la couleur de la catégorie. */
function QuestionTitle({
  ui,
  category,
}: Readonly<{ ui: Ui; category: ProjectedStudentView['categories'][number] | undefined }>) {
  if (category === undefined) return null
  const points =
    category.maxPoints === undefined
      ? undefined
      : ui.text('passage_category_max', {
          max: formatRawScore(toMilli(category.maxPoints), ui.locale),
          points: category.maxPoints,
        })
  return (
    <p className="flex items-center gap-2.5 text-lg font-bold tracking-[.06em] text-[var(--category-ink,var(--color-primary))] uppercase">
      {category.icon !== undefined && (
        <CategoryIcon name={category.icon} className="size-6.5 shrink-0" />
      )}
      {points === undefined ? category.label : `${category.label} · ${points}`}
    </p>
  )
}

/**
 * Écran étudiant de la vue projetée (artboards `projection-*`) : en-tête (nom, cartes « Question »
 * et « Score »), grande grille des catégories tant qu'aucune question n'est tirée, rangée compacte
 * et question en carte teintée pendant une question, note finale une fois révélée (sans tuiles).
 */
export function StudentScreen({
  view,
  animate = true,
}: Readonly<{ view: ProjectedStudentView; animate?: boolean }>) {
  const ui = useUi()
  // `drawnAt` présent au montage (ouverture, réouverture, changement d'étudiant) : jamais animé.
  const [initialDrawnAt] = useState(view.current?.drawnAt)
  const { current } = view
  const currentCategory =
    current === undefined
      ? undefined
      : view.categories.find((category) => category.id === current.categoryId)
  const accent = categoryAccent(currentCategory?.color)
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 @min-[40rem]:px-16 @min-[40rem]:py-12">
      <ProjectionHeader ui={ui} view={view} />
      {view.final === undefined ? (
        <CategoryTiles
          ui={ui}
          variant={current === undefined ? 'grid' : 'row'}
          categories={view.categories}
          currentCategoryId={current?.categoryId}
          finished={view.finished}
        />
      ) : (
        <Final ui={ui} view={view} />
      )}
      {current !== undefined && (
        <DrawReveal
          key={current.drawnAt}
          color={currentCategory?.color}
          animate={animate && view.drawAnimation && current.drawnAt !== initialDrawnAt}
        >
          {/* `wrap-anywhere` : un mot sans espace coupe au lieu d'élargir l'écran (#118). */}
          <section
            aria-label={ui.text('present_prompt_label', {})}
            style={accent}
            className="flex min-h-0 flex-1 flex-col gap-4.5 rounded-xl border-[1.5px] border-[color:color-mix(in_oklch,var(--category-color,var(--color-primary))_35%,transparent)] bg-[color:color-mix(in_oklch,var(--category-color,var(--color-primary))_8%,var(--color-card))] px-11 py-8 wrap-anywhere"
          >
            <QuestionTitle ui={ui} category={currentCategory} />
            <Markdown source={current.prompt} ui={ui} size="projection" />
          </section>
        </DrawReveal>
      )}
    </div>
  )
}
