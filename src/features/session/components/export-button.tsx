import { IconFileSpreadsheet } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Session } from '@/domain/session/types'
import { exportWorkbook } from '@/features/session/export-workbook'
import type { Ui } from '@/lib/i18n/use-ui'

type ExportState = 'idle' | 'busy' | 'failed'

/** Bouton « Exporter en Excel » : désactivé pendant l'export, message `role="alert"` si échec. */
export function ExportButton({ ui, session }: Readonly<{ ui: Ui; session: Session }>) {
  const [state, setState] = useState<ExportState>('idle')

  async function run(): Promise<void> {
    if (state === 'busy') return
    setState('busy')
    try {
      await exportWorkbook(session, ui.locale)
      setState('idle')
    } catch {
      setState('failed')
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" disabled={state === 'busy'} onClick={() => void run()}>
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
