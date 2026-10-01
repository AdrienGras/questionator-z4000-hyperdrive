import { memo, type CSSProperties } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import { Markdown } from '@/components/markdown/markdown'
import type { NormalizedCategory, NormalizedQuestion } from '@/domain/config/normalize'
import { useUi, type Ui } from '@/lib/i18n/use-ui'

type QuestionPreviewProps = Readonly<{
  /** Langue de l'éditeur, pour l'habillage ; le contenu suit la portée de langue englobante. */
  ui: Ui
  category: NormalizedCategory
  question: NormalizedQuestion
}>

/**
 * Carte d'une question : en-tête, énoncé rendu comme à la projection, réponse attendue repliée.
 * Les Markdown suivent la langue de la portée (`LocaleScope` de l'aperçu : celle de la config).
 */
export const QuestionPreview = memo(function QuestionPreview({
  ui,
  category,
  question,
}: QuestionPreviewProps) {
  const contentUi = useUi()
  const { color, icon } = category
  const accent: (CSSProperties & Record<'--category-color', string>) | undefined =
    color === undefined ? undefined : { '--category-color': color }
  return (
    <article className="space-y-3 rounded-md border bg-card p-4 text-card-foreground">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {color !== undefined && (
          <span
            aria-hidden
            style={accent}
            className="size-3 shrink-0 rounded-full bg-[var(--category-color)]"
          />
        )}
        {icon !== undefined && (
          <CategoryIcon
            name={icon}
            className="size-4 shrink-0 text-[var(--category-color,currentColor)]"
          />
        )}
        <span className="font-medium">{category.label}</span>
        <code className="text-xs text-muted-foreground">{question.id}</code>
        <span>{question.title}</span>
        <span className="ml-auto text-muted-foreground">{category.scale.join(' / ')}</span>
      </header>
      <Markdown source={question.prompt} ui={contentUi} size="projection" />
      {question.answer !== undefined && question.answer.trim() !== '' && (
        <details className="rounded-md border p-2">
          <summary lang={ui.locale} className="cursor-pointer text-sm font-medium">
            {ui.text('editor_expected_answer', {})}
          </summary>
          <Markdown source={question.answer} ui={contentUi} className="mt-2" />
        </details>
      )}
    </article>
  )
})
