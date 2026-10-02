import { useCallback, useState } from 'react'

export type SidePanelTab = 'student' | 'students'

/**
 * État du tiroir latéral : fermé à chaque montage, rien n'est mémorisé (D91). `show(tab)` ouvre le
 * tiroir sur un onglet, « Étudiant » par défaut : le bouton « Panneau » rouvre toujours sur
 * l'étudiant en cours, quel que soit l'onglet laissé à la fermeture.
 */
export function useSidePanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<SidePanelTab>('student')

  const show = useCallback((next: SidePanelTab = 'student') => {
    setTab(next)
    setOpen(true)
  }, [])

  return { open, tab, setOpen, setTab, show }
}
