export type SidePanelTab = 'student' | 'students'

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

export function readSidePanelTab(): SidePanelTab {
  return readItem(TAB_KEY) === 'students' ? 'students' : 'student'
}

export function writeSidePanelTab(tab: SidePanelTab): void {
  writeItem(TAB_KEY, tab)
}
