import { Card, CardContent } from '@/components/ui/card'
import type { Ui } from '@/lib/i18n/use-ui'

/** Aucun entraînement : un message seul, « Nouvel entraînement » est dans l'en-tête de la page. */
export function TrainingsEmpty({ ui }: Readonly<{ ui: Ui }>) {
  const { text } = ui
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        <h3 className="text-xl font-semibold">{text('trainings_empty_title', {})}</h3>
        <p className="max-w-md text-muted-foreground">{text('trainings_empty_body', {})}</p>
      </CardContent>
    </Card>
  )
}
