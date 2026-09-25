type WithSeverity = { severity: 'error' | 'warning' }

/** Erreurs d'abord, puis avertissements, chacun dans son ordre d'origine. */
export function errorsFirst<T extends WithSeverity>(issues: readonly T[]): T[] {
  return [
    ...issues.filter((issue) => issue.severity === 'error'),
    ...issues.filter((issue) => issue.severity === 'warning'),
  ]
}

/**
 * Clés React stables pour une liste qui peut contenir des doublons : la clé de base est suffixée
 * de son rang d'occurrence (pas d'index seul, Sonar S6479).
 */
export function keyed<T>(
  items: readonly T[],
  baseKey: (item: T) => string,
): { item: T; key: string }[] {
  const seen = new Map<string, number>()
  return items.map((item) => {
    const base = baseKey(item)
    const occurrence = seen.get(base) ?? 0
    seen.set(base, occurrence + 1)
    return { item, key: `${base}#${occurrence}` }
  })
}
