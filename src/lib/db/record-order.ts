/** `updatedAt` d'un enregistrement brut s'il est une chaîne, sinon `undefined` (hors index). */
function updatedAtOf(record: unknown): string | undefined {
  if (typeof record !== 'object' || record === null || !('updatedAt' in record)) return undefined
  const { updatedAt } = record
  return typeof updatedAt === 'string' ? updatedAt : undefined
}

/**
 * Ordre des listes (sessions, entraînements) : `updatedAt` décroissant, à égalité `id`
 * décroissant (l'ordre de l'index `updatedAt` parcouru à l'envers) ; les enregistrements sans
 * `updatedAt` texte en fin, par `id` croissant (l'ordre de la clé primaire).
 */
export function compareRecords(a: { id: string }, b: { id: string }): number {
  const left = updatedAtOf(a)
  const right = updatedAtOf(b)
  if (left === undefined || right === undefined) {
    if (left !== right) return left === undefined ? 1 : -1
    return a.id < b.id ? -1 : 1
  }
  if (left !== right) return left < right ? 1 : -1
  return a.id < b.id ? 1 : -1
}
