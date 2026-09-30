function rowCountFor(n: number): number {
  if (n <= 3) return 1
  if (n <= 10) return 2
  return 3
}

/**
 * Répartition des tuiles de catégorie en lignes selon leur nombre (F25, D74) : 1 ligne jusqu'à 3,
 * 2 jusqu'à 10, 3 au-delà. Les lignes comptent ⌈n/r⌉ ou ⌊n/r⌋ tuiles, les plus longues en premier.
 * Toutes les catégories comptent (épuisées comprises) : la disposition ne bouge pas en passage.
 */
export function categoryRows(n: number): number[] {
  if (n <= 0) return []
  const rowCount = rowCountFor(n)
  const short = Math.floor(n / rowCount)
  const longRows = n % rowCount

  return Array.from({ length: rowCount }, (_, i) => (i < longRows ? short + 1 : short))
}
