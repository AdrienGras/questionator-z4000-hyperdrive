import { useRef, useState } from 'react'
import { exportWorkbook } from '@/components/export/export-workbook'
import type { Session } from '@/domain/session/types'
import type { Locale } from '@/lib/i18n/i18n'

export type WorkbookExportState = 'idle' | 'busy' | 'failed'

/**
 * État et déclencheur de l'export Excel d'une session. La garde anti double-clic est une ref et
 * non l'état : deux appels dans le même tick verraient tous deux `idle` (BACKLOG #54).
 */
export function useWorkbookExport(locale: Locale): {
  state: WorkbookExportState
  run: (session: Session) => Promise<void>
} {
  const [state, setState] = useState<WorkbookExportState>('idle')
  const running = useRef(false)

  async function run(session: Session): Promise<void> {
    if (running.current) return
    running.current = true
    setState('busy')
    try {
      await exportWorkbook(session, locale)
      setState('idle')
    } catch {
      setState('failed')
    } finally {
      running.current = false
    }
  }

  return { state, run }
}
