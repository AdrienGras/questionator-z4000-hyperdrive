/** État replié du menu latéral (D103), mémorisé sur l'appareil. */
const KEY = 'questionator:menu-collapsed'

/** `true` seulement si `'true'` est stocké : absence, valeur inconnue ou stockage illisible = déplié. */
export function readMenuCollapsed(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true'
  } catch {
    return false
  }
}

/** Écriture best-effort : un stockage inaccessible garde l'état pour la seule durée de la page. */
export function writeMenuCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(KEY, String(collapsed))
  } catch {
    // Navigation privée, quota : l'état reste en mémoire.
  }
}
