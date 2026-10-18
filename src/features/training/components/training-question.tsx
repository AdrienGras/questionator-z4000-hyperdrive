import { IconChevronDown, IconChevronUp, IconPlayerSkipForward } from '@tabler/icons-react'
import { useId, useState } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import { categoryAccent } from '@/lib/appearance/category-accent'
import { Markdown } from '@/components/markdown/markdown'
import { ScaleButtons } from '@/components/scale-buttons'
import { Button } from '@/components/ui/button'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import { categoryOfQuestion } from '@/domain/training/resolve-draw'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import { useFocusOnMount } from '@/features/training/hooks/use-focus-on-mount'

type TrainingQuestionProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  questionId: string
  disabled: boolean
  /** Apparition courte à l'arrivée (`presentation.drawAnimation`), neutralisée par `motion-safe`. */
  animate: boolean
  /** Focalise le titre au montage : question qui arrive après un tirage. */
  focusOnMount: boolean
  onScore: (points: number) => void
  onPass: () => void
}>

// Teinte de catégorie (D103) : bordure à 35 %, fond à 6 % sur la carte, neutre sans couleur.
const CARD_TINT =
  'border-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_35%,transparent)] ' +
  'bg-[color:color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_6%,var(--color-card))]'

function PassButton({
  ui,
  disabled,
  onPass,
}: Readonly<{ ui: Ui; disabled: boolean; onPass: () => void }>) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-muted-foreground"
      disabled={disabled}
      onClick={onPass}
    >
      <IconPlayerSkipForward data-icon="inline-start" aria-hidden="true" />
      {ui.text('training_pass', {})}
    </Button>
  )
}

/** Réponse attendue, barème compris (dans le Markdown), dans un repli ouvert à la révélation. */
function AnswerDisclosure({ ui, answer }: Readonly<{ ui: Ui; answer: string | undefined }>) {
  const { text } = ui
  const [open, setOpen] = useState(true)
  // Le titre prend le focus à la révélation.
  const titleRef = useFocusOnMount<HTMLHeadingElement>(true)
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="rounded-lg bg-background"
    >
      <summary className="min-h-11 cursor-pointer justify-between gap-3 rounded-lg py-2.5 pr-3 pl-5 before:hidden">
        <h3
          ref={titleRef}
          tabIndex={-1}
          className="text-label text-muted-foreground uppercase outline-none"
        >
          {text('training_answer_title', {})}
        </h3>
        <span className="inline-flex items-center gap-1.5 text-small font-semibold text-muted-foreground">
          {text(open ? 'training_answer_hide' : 'training_answer_show', {})}
          {open ? (
            <IconChevronUp aria-hidden="true" className="size-4" />
          ) : (
            <IconChevronDown aria-hidden="true" className="size-4" />
          )}
        </span>
      </summary>
      <div className="flex flex-col gap-3 px-5 pb-5">
        {answer === undefined ? (
          <p className="text-muted-foreground">{text('training_no_answer', {})}</p>
        ) : (
          <Markdown source={answer} ui={ui} />
        )}
      </div>
    </details>
  )
}

type ScoringProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  category: NormalizedCategory
  disabled: boolean
  onScore: (points: number) => void
  onPass: () => void
}>

/** « Notez-vous · sur N » et le barème en rangée teintée, « Passer » à droite. */
function Scoring({ ui, config, category, disabled, onScore, onPass }: ScoringProps) {
  const { text, locale } = ui
  const headingId = useId()
  const max = formatScore(toMilli(Math.max(...category.scale)), 'raw', config, locale)
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
      <div className="flex flex-col gap-2">
        <h3 id={headingId} className="font-semibold">
          {text('training_score_heading', {})}{' '}
          <span className="font-normal text-muted-foreground">
            {text('training_score_max', { max })}
          </span>
        </h3>
        <ScaleButtons
          ui={ui}
          config={config}
          scale={category.scale}
          disabled={disabled}
          variant="row"
          onScore={onScore}
        />
      </div>
      <PassButton ui={ui} disabled={disabled} onPass={onPass} />
    </div>
  )
}

/**
 * Question en cours d'un entraînement (artboard `entrainement-question`) : carte teintée de sa
 * catégorie, surtitre « Normal · 2 pts », titre, énoncé, puis « Voir la réponse » ; une fois
 * révélée, la réponse repliable et la notation. « Passer » reste disponible avant et après. L'état
 * révélé est local : l'appelant remonte le composant à chaque tirage (`key`), et un rechargement
 * le masque à nouveau.
 */
export function TrainingQuestion({
  ui,
  config,
  questionId,
  disabled,
  animate,
  focusOnMount,
  onScore,
  onPass,
}: TrainingQuestionProps) {
  const { text, locale } = ui
  const [revealed, setRevealed] = useState(false)
  const titleRef = useFocusOnMount<HTMLHeadingElement>(focusOnMount)
  const category = categoryOfQuestion(config, questionId)
  const question = category?.questions.find((q) => q.id === questionId)
  // La config a perdu la question (journal plus récent qu'elle) : on peut seulement passer.
  const missing = category === undefined || question === undefined

  return (
    <section
      aria-label={text('present_prompt_label', {})}
      style={categoryAccent(category?.color)}
      className={cn(
        'flex flex-col gap-5 rounded-xl border p-7 wrap-anywhere',
        CARD_TINT,
        animate && 'motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in',
      )}
    >
      {missing && (
        <>
          <p ref={titleRef} tabIndex={-1} className="outline-none">
            {text('training_question_missing', {})}
          </p>
          <div className="flex justify-end">
            <PassButton ui={ui} disabled={disabled} onPass={onPass} />
          </div>
        </>
      )}
      {!missing && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-2 text-label text-[var(--category-ink,var(--color-muted-foreground))] uppercase">
              {category.icon !== undefined && (
                <CategoryIcon name={category.icon} className="size-4 shrink-0" />
              )}
              {`${category.label} · ${text('passage_category_max', {
                max: formatScore(toMilli(Math.max(...category.scale)), 'raw', config, locale),
                points: Math.max(...category.scale),
              })}`}
            </span>
            <h2
              ref={titleRef}
              tabIndex={-1}
              className="text-2xl leading-8 font-bold tracking-tight outline-none"
            >
              {question.title}
            </h2>
          </div>
          <Markdown source={question.prompt} ui={ui} />
          {revealed ? (
            <>
              <AnswerDisclosure ui={ui} answer={question.answer} />
              <Scoring
                ui={ui}
                config={config}
                category={category}
                disabled={disabled}
                onScore={onScore}
                onPass={onPass}
              />
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button type="button" onClick={() => setRevealed(true)}>
                {text('training_reveal', {})}
              </Button>
              <PassButton ui={ui} disabled={disabled} onPass={onPass} />
            </div>
          )}
        </>
      )}
    </section>
  )
}
