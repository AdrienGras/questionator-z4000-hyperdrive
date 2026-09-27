import type { Ui } from '@/lib/i18n/use-ui'

/** État affiché dans la zone de passage quand l'étudiant actif est marqué absent (§7). */
export function AbsentState({ ui }: Readonly<{ ui: Ui }>) {
  const { text } = ui
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{text('passage_absent_title', {})}</h2>
      <p className="text-muted-foreground">{text('passage_absent_body', {})}</p>
    </div>
  )
}
