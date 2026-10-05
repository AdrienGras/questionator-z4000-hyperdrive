const KEY = 'questionator:config-handoff'
const EDITOR_KEY = 'questionator:editor-handoff'

export type ConfigHandoff = { text: string; fileName: string }

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

/** Dépose une config sous `key`. Stockage indisponible ou plein : sans effet. */
function stash(key: string, handoff: ConfigHandoff): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(handoff))
  } catch {
    // L'écran de destination s'ouvrira simplement sans config reprise.
  }
}

/** Lit puis efface la config déposée sous `key` ; `undefined` si rien, illisible ou stockage indisponible. */
function take(key: string): ConfigHandoff | undefined {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw === null) return undefined
    sessionStorage.removeItem(key)
    const parsed: unknown = JSON.parse(raw)
    return isHandoff(parsed) ? { text: parsed.text, fileName: parsed.fileName } : undefined
  } catch {
    return undefined
  }
}

/** Dépose une config à reprendre à l'écran de création (F26). */
export const stashConfigForCreation = (handoff: ConfigHandoff): void => stash(KEY, handoff)

/** Reprend la config déposée pour l'écran de création. */
export const takeConfigForCreation = (): ConfigHandoff | undefined => take(KEY)

/** Dépose une config à reprendre dans l'éditeur (F43.3) ; l'éditeur s'ouvre sinon sur son brouillon. */
export const stashConfigForEditor = (handoff: ConfigHandoff): void => stash(EDITOR_KEY, handoff)

/** Reprend la config déposée pour l'éditeur. */
export const takeConfigForEditor = (): ConfigHandoff | undefined => take(EDITOR_KEY)
