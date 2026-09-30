import { IconFileSpreadsheet } from '@tabler/icons-react'
import { useWorkbookExport } from '@/components/export/use-workbook-export'
import { Button } from '@/components/ui/button'
import type { Session } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

/** Bouton « Exporter en Excel » : désactivé pendant l'export, message `role="alert"` si échec. */
export function ExportButton({ ui, session }: Readonly<{ ui: Ui; session: Session }>) {
  const { state, run } = useWorkbookExport(ui.locale)

  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" disabled={state === 'busy'} onClick={() => void run(session)}>
        <IconFileSpreadsheet aria-hidden />
        {ui.text(state === 'busy' ? 'export_busy' : 'export_button', {})}
      </Button>
      {state === 'failed' && (
        <p role="alert" className="text-sm text-destructive">
          {ui.text('export_error', {})}
        </p>
      )}
    </div>
  )
}
