import { Markdown } from '@/components/markdown/markdown'
import { Button } from '@/components/ui/button'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Attempt } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { SkipButton } from './skip-button'

type QuestionPanelProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  attempt: Attempt
  disabled: boolean
  skipsRemaining: number
  onScore: (attemptId: string, value: number) => void
  onSkip: (attemptId: string, reason: string | undefined) => void
}>

/**
 * Panneau de la question `pending` (§7) : catégorie, titre, énoncé, éléments de réponse repliés
 * (`key={attempt.id}` remet le `<details>` à zéro à chaque nouvelle question, D28) et un bouton
 * par valeur du barème, puis le bouton de skip (F10). `attempt` désigne toujours une catégorie et une question de la config
 * figée dans la session : si l'une des deux est introuvable, la donnée est corrompue (comme
 * `scoreOf` du moteur de notation).
 */
export function QuestionPanel({
  ui,
  config,
  attempt,
  disabled,
  skipsRemaining,
  onScore,
  onSkip,
}: QuestionPanelProps) {
  const { text, locale } = ui
  const category = config.categories.find((c) => c.id === attempt.categoryId)
  if (category === undefined) {
    throw new Error(
      `Attempt « ${attempt.id} » désigne une catégorie introuvable : donnée corrompue`,
    )
  }
  const question = category.questions.find((q) => q.id === attempt.questionId)
  if (question === undefined) {
    throw new Error(`Attempt « ${attempt.id} » désigne une question introuvable : donnée corrompue`)
  }

  return (
    // Région nommée comme sur la vue projetée : la question en cours s'atteint par son rôle.
    // `wrap-anywhere`, hérité : une URL ou un mot sans espace coupe au lieu d'élargir la page ;
    // les blocs de code (`white-space: pre`) n'y sont pas sensibles et défilent (#118).
    <section
      aria-label={text('present_prompt_label', {})}
      className="flex flex-col gap-4 wrap-anywhere"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{category.label}</span>
        <h2 className="text-lg font-semibold">{question.title}</h2>
      </div>
      <Markdown source={question.prompt} ui={ui} />
      {question.answer !== undefined && (
        <details key={attempt.id}>
          <summary className="cursor-pointer text-sm font-medium">
            {text('passage_answer', {})}
          </summary>
          <Markdown source={question.answer} ui={ui} />
        </details>
      )}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{text('passage_score_heading', {})}</h3>
        <div className="flex flex-wrap gap-2">
          {category.scale.map((value) => {
            const formatted = formatScore(toMilli(value), 'raw', config, locale)
            return (
              <Button
                key={value}
                type="button"
                variant="outline"
                disabled={disabled}
                aria-label={text('passage_score_button', { value: formatted })}
                onClick={() => onScore(attempt.id, value)}
              >
                {formatted}
              </Button>
            )
          })}
        </div>
      </div>
      <SkipButton
        ui={ui}
        skips={config.skips}
        remaining={skipsRemaining}
        disabled={disabled}
        onSkip={(reason) => onSkip(attempt.id, reason)}
      />
    </section>
  )
}
