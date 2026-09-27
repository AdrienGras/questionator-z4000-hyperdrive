import { Markdown } from '@/components/markdown/markdown'
import { Button } from '@/components/ui/button'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Attempt } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

type QuestionPanelProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  attempt: Attempt
  disabled: boolean
  onScore: (attemptId: string, value: number) => void
}>

/**
 * Panneau de la question `pending` (§7) : catégorie, titre, énoncé, éléments de réponse repliés
 * (`key={attempt.id}` remet le `<details>` à zéro à chaque nouvelle question, D28) et un bouton
 * par valeur du barème. `attempt` désigne toujours une catégorie et une question de la config
 * figée dans la session : si l'une des deux est introuvable, la donnée est corrompue (comme
 * `scoreOf` du moteur de notation).
 */
export function QuestionPanel({ ui, config, attempt, disabled, onScore }: QuestionPanelProps) {
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
    <section className="flex flex-col gap-4">
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
      <div data-slot="skip" />
    </section>
  )
}
