import { useCallback, useState } from 'react'
import {
  readSidePanelTab,
  writeSidePanelTab,
  type SidePanelTab,
} from '@/features/session/side-panel-state'

/**
 * État du tiroir latéral : fermé à chaque montage (rien n'est mémorisé), seul l'onglet actif
 * l'est. `show(tab)` ouvre le tiroir directement sur un onglet.
 */
export function useSidePanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTabState] = useState<SidePanelTab>(readSidePanelTab)

  const setTab = useCallback((next: SidePanelTab) => {
    writeSidePanelTab(next)
    setTabState(next)
  }, [])

  const show = useCallback(
    (next: SidePanelTab) => {
      setTab(next)
      setOpen(true)
    },
    [setTab],
  )

  return { open, tab, setOpen, setTab, show }
}
