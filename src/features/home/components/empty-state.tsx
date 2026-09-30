import { Card, CardContent } from '@/components/ui/card'
import type { Ui } from '@/lib/i18n/use-ui'

type EmptyStateProps = Readonly<{ ui: Ui }>

/** Liste vide : un message seul, les actions (création, import) sont dans `ActionCards`. */
export function EmptyState({ ui }: EmptyStateProps) {
  const { text } = ui
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        <h3 className="text-xl font-semibold">{text('empty_title', {})}</h3>
        <p className="max-w-md text-muted-foreground">{text('empty_body', {})}</p>
      </CardContent>
    </Card>
  )
}
