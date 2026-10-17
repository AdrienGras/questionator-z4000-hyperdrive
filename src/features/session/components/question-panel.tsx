import { Markdown } from '@/components/markdown/markdown'
import { CategoryBadge } from '@/components/category-badge'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatRawScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Attempt } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

type QuestionPanelProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  attempt: Attempt
}>

/**
 * Carte de la question `pending` (§7, artboard `passage-question`) : catégorie et points, titre,
 * énoncé, éléments de réponse repliés (`key={attempt.id}` remet le `<details>` à zéro à chaque
 * nouvelle question, D28). La notation et le skip sont dans la carte « Note » (`ScoreCard`).
 * `attempt` désigne toujours une catégorie et une question de la config figée dans la session : si
 * l'une des deux est introuvable, la donnée est corrompue (comme `scoreOf` du moteur de notation).
 */
export function QuestionPanel({ ui, config, attempt }: QuestionPanelProps) {
  const { text } = ui
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

  const points = Math.max(...category.scale)
  return (
    // Région nommée comme sur la vue projetée : la question en cours s'atteint par son rôle.
    // `wrap-anywhere`, hérité : une URL ou un mot sans espace coupe au lieu d'élargir la page ;
    // les blocs de code (`white-space: pre`) n'y sont pas sensibles et défilent (#118).
    <section
      aria-label={text('present_prompt_label', {})}
      className="flex flex-col gap-5 rounded-lg bg-card p-7 wrap-anywhere shadow-card"
    >
      <div className="flex items-center gap-2.5">
        <CategoryBadge color={category.color} icon={category.icon} size="md" />
        <span className="font-semibold">{category.label}</span>
        <span className="text-small text-muted-foreground">
          {`· ${text('passage_category_max', { max: formatRawScore(toMilli(points), ui.locale), points })}`}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <h2 className="text-h2">{question.title}</h2>
        <Markdown source={question.prompt} ui={ui} />
      </div>
      {question.answer !== undefined && (
        <details key={attempt.id} className="border-t pt-1">
          <summary className="flex h-10 cursor-pointer items-center text-sm font-semibold">
            {text('passage_answer', {})}
          </summary>
          <Markdown source={question.answer} ui={ui} className="text-muted-foreground" />
        </details>
      )}
    </section>
  )
}
