import { useState } from 'react'
import { Markdown } from '@/components/markdown/markdown'
import { ScaleButtons } from '@/components/scale-buttons'
import { Button } from '@/components/ui/button'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
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

type AnswerProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  category: NormalizedCategory
  answer: string | undefined
  disabled: boolean
  onScore: (points: number) => void
}>

/** Réponse révélée puis barème ; son titre prend le focus à la révélation. */
function RevealedAnswer({ ui, config, category, answer, disabled, onScore }: AnswerProps) {
  const { text } = ui
  const titleRef = useFocusOnMount<HTMLHeadingElement>(true)
  return (
    <>
      <div className="flex flex-col gap-2">
        <h3 ref={titleRef} tabIndex={-1} className="font-semibold outline-none">
          {text('training_answer_title', {})}
        </h3>
        {answer === undefined ? (
          <p className="text-muted-foreground">{text('training_no_answer', {})}</p>
        ) : (
          <Markdown source={answer} ui={ui} />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{text('training_score_heading', {})}</h3>
        <ScaleButtons
          ui={ui}
          config={config}
          scale={category.scale}
          disabled={disabled}
          onScore={onScore}
        />
      </div>
    </>
  )
}

/**
 * Question en cours d'un entraînement : catégorie, titre, énoncé, puis « Voir la réponse » ;
 * « Passer » reste visible avant et après la révélation. L'état révélé est local : l'appelant
 * remonte le composant à chaque tirage (`key`), et un rechargement le masque à nouveau.
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
  const { text } = ui
  const [revealed, setRevealed] = useState(false)
  const titleRef = useFocusOnMount<HTMLHeadingElement>(focusOnMount)
  const category = categoryOfQuestion(config, questionId)
  const question = category?.questions.find((q) => q.id === questionId)
  // La config a perdu la question (journal plus récent qu'elle) : on peut seulement passer.
  const missing = category === undefined || question === undefined

  return (
    <section
      aria-label={text('present_prompt_label', {})}
      className={cn(
        'flex flex-col gap-4 wrap-anywhere',
        animate && 'motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in',
      )}
    >
      {missing && (
        <p ref={titleRef} tabIndex={-1} className="outline-none">
          {text('training_question_missing', {})}
        </p>
      )}
      {!missing && (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{category.label}</span>
            <h2 ref={titleRef} tabIndex={-1} className="text-lg font-semibold outline-none">
              {question.title}
            </h2>
          </div>
          <Markdown source={question.prompt} ui={ui} />
          {revealed ? (
            <RevealedAnswer
              ui={ui}
              config={config}
              category={category}
              answer={question.answer}
              disabled={disabled}
              onScore={onScore}
            />
          ) : (
            <Button type="button" className="self-start" onClick={() => setRevealed(true)}>
              {text('training_reveal', {})}
            </Button>
          )}
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        className="self-start"
        disabled={disabled}
        onClick={onPass}
      >
        {text('training_pass', {})}
      </Button>
    </section>
  )
}
