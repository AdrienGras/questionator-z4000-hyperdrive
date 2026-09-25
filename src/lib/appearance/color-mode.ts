export type ColorMode = 'light' | 'dark' | 'system'
export type EffectiveMode = 'light' | 'dark'
export type ColorModeView = 'examiner' | 'present'

const COLOR_MODES: readonly ColorMode[] = ['light', 'dark', 'system']
const KEY_PREFIX = 'questionator:color-mode:'

export function isColorMode(value: unknown): value is ColorMode {
  return typeof value === 'string' && (COLOR_MODES as readonly string[]).includes(value)
}

/** Choix mémorisé, sinon défaut de la portée ; `system` est tranché par la préférence du système. */
export function resolveColorMode(
  stored: ColorMode | undefined,
  fallback: ColorMode,
  systemPrefersDark: boolean,
): EffectiveMode {
  const mode = stored ?? fallback
  if (mode === 'system') return systemPrefersDark ? 'dark' : 'light'
  return mode
}

/** Clé `localStorage` du choix manuel : globale hors session, par session et par vue en session (D26). */
export function colorModeKey(scope: 'global' | { sessionId: string; view: ColorModeView }): string {
  if (scope === 'global') return `${KEY_PREFIX}global`
  return `${KEY_PREFIX}${scope.sessionId}:${scope.view}`
}

/** `undefined` si la clé est absente, invalide ou si le stockage est inaccessible. */
export function readStoredMode(key: string): ColorMode | undefined {
  try {
    const value = localStorage.getItem(key)
    return isColorMode(value) ? value : undefined
  } catch {
    return undefined
  }
}

export function writeStoredMode(key: string, mode: ColorMode): void {
  try {
    localStorage.setItem(key, mode)
  } catch {
    // Stockage inaccessible (navigation privée, quota) : le choix ne vaut que pour la fenêtre.
  }
}
