/**
 * Copie synchrone du commentaire en cours de saisie dans `localStorage` (D82). L'écriture IndexedDB
 * lancée à `pagehide` n'aboutit pas avant le déchargement : seule une écriture synchrone survit à un
 * rechargement immédiat. Tout accès est protégé : sans stockage, le champ marche comme avant.
 */
const PREFIX = 'questionator:comment-draft:'

function key(sessionId: string, studentId: string): string {
  return `${PREFIX}${sessionId}:${studentId}`
}

export function readCommentDraft(sessionId: string, studentId: string): string | undefined {
  try {
    return localStorage.getItem(key(sessionId, studentId)) ?? undefined
  } catch {
    return undefined
  }
}

export function writeCommentDraft(sessionId: string, studentId: string, value: string): void {
  try {
    localStorage.setItem(key(sessionId, studentId), value)
  } catch {
    // Stockage indisponible ou plein : la copie est un confort, on ignore.
  }
}

/** Supprime la copie ; avec `onlyIfEqualTo`, seulement si elle vaut encore cette valeur (pas une frappe plus récente). */
export function clearCommentDraft(
  sessionId: string,
  studentId: string,
  onlyIfEqualTo?: string,
): void {
  try {
    const k = key(sessionId, studentId)
    if (onlyIfEqualTo !== undefined && localStorage.getItem(k) !== onlyIfEqualTo) return
    localStorage.removeItem(k)
  } catch {
    // Voir `writeCommentDraft`.
  }
}

/**
 * Supprime toutes les copies de la session : à appeler quand la session disparaît (suppression) ou
 * est remplacée (import d'un backup), sinon une copie restée l'emporterait sur le commentaire
 * importé à la prochaine ouverture du champ.
 */
export function clearSessionCommentDrafts(sessionId: string): void {
  try {
    const prefix = `${PREFIX}${sessionId}:`
    // Clés relevées avant de supprimer : `removeItem` décale les index de `localStorage.key`.
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
    for (const k of keys) if (k?.startsWith(prefix) === true) localStorage.removeItem(k)
  } catch {
    // Voir `writeCommentDraft`.
  }
}
