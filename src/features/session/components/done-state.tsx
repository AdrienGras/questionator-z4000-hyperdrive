import type { Ui } from '@/lib/i18n/use-ui'

/** État affiché dans la zone de passage une fois les `questionsPerStudent` questions notées (§7). */
export function DoneState({ ui, rawScore }: Readonly<{ ui: Ui; rawScore: string }>) {
  const { text } = ui
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{text('passage_done_title', {})}</h2>
      <p className="text-muted-foreground">{text('passage_done_body', {})}</p>
      <p>{text('passage_raw_score', { score: rawScore })}</p>
    </div>
  )
}
