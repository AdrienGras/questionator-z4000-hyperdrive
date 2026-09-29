export type SidePanelTab = 'student' | 'students'

const OPEN_KEY = 'questionator:side-panel:open'
const TAB_KEY = 'questionator:side-panel:tab'

function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Stockage inaccessible (navigation privée, quota) : le choix ne vaut que pour la fenêtre.
  }
}

/** Panneau ouvert par défaut ; toute valeur autre que `'false'` compte comme ouvert. */
export function readSidePanelOpen(): boolean {
  return readItem(OPEN_KEY) !== 'false'
}

export function writeSidePanelOpen(open: boolean): void {
  writeItem(OPEN_KEY, open ? 'true' : 'false')
}

export function readSidePanelTab(): SidePanelTab {
  return readItem(TAB_KEY) === 'students' ? 'students' : 'student'
}

export function writeSidePanelTab(tab: SidePanelTab): void {
  writeItem(TAB_KEY, tab)
}
