const KEY = 'questionator:config-handoff'
const EDITOR_KEY = 'questionator:editor-handoff'

export type ConfigHandoff = { text: string; fileName: string }

/** Dépose une config à reprendre à l'écran de création (F26). Stockage indisponible : sans effet. */
export function stashConfigForCreation(handoff: ConfigHandoff): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(handoff))
  } catch {
    // Stockage indisponible ou plein : l'écran de création s'ouvrira simplement vide.
  }
}

function isHandoff(value: unknown): value is ConfigHandoff {
  return (
    typeof value === 'object' &&
    value !== null &&
    'text' in value &&
    typeof value.text === 'string' &&
    'fileName' in value &&
    typeof value.fileName === 'string'
  )
}

/** Lit puis efface la config déposée ; `undefined` si rien, illisible ou stockage indisponible. */
export function takeConfigForCreation(): ConfigHandoff | undefined {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw === null) return undefined
    sessionStorage.removeItem(KEY)
    const parsed: unknown = JSON.parse(raw)
    return isHandoff(parsed) ? { text: parsed.text, fileName: parsed.fileName } : undefined
  } catch {
    return undefined
  }
}

/** Dépose une config à reprendre dans l'éditeur (F43.3). Stockage indisponible : sans effet. */
export function stashConfigForEditor(handoff: ConfigHandoff): void {
  try {
    sessionStorage.setItem(EDITOR_KEY, JSON.stringify(handoff))
  } catch {
    // Stockage indisponible ou plein : l'éditeur s'ouvrira sur son brouillon.
  }
}

/** Lit puis efface la config déposée pour l'éditeur ; `undefined` si rien, illisible ou stockage indisponible. */
export function takeConfigForEditor(): ConfigHandoff | undefined {
  try {
    const raw = sessionStorage.getItem(EDITOR_KEY)
    if (raw === null) return undefined
    sessionStorage.removeItem(EDITOR_KEY)
    const parsed: unknown = JSON.parse(raw)
    return isHandoff(parsed) ? { text: parsed.text, fileName: parsed.fileName } : undefined
  } catch {
    return undefined
  }
}
