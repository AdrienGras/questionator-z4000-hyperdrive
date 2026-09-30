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
  const [tab, setTab] = useState<SidePanelTab>(readSidePanelTab)

  // Change l'onglet et le mémorise ; exposé sous le nom `setTab`.
  const selectTab = useCallback((next: SidePanelTab) => {
    writeSidePanelTab(next)
    setTab(next)
  }, [])

  const show = useCallback(
    (next: SidePanelTab) => {
      selectTab(next)
      setOpen(true)
    },
    [selectTab],
  )

  return { open, tab, setOpen, setTab: selectTab, show }
}
