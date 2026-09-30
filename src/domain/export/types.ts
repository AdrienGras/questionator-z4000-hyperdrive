/**
 * Modèle neutre du classeur (D71) : décrit les onglets sans dépendre de la bibliothèque xlsx.
 * Aucune formule par construction ; `null` = cellule vide.
 */
export type Cell =
  | { kind: 'text'; value: string; bold?: boolean }
  | { kind: 'number'; value: number; format?: string }
  | { kind: 'date'; value: Date; format: string }
  | null

/** Un onglet : nom, largeur de chaque colonne, lignes, nombre de lignes figées en tête. */
export type SheetSpec = {
  name: string
  columns: { width: number }[]
  rows: Cell[][]
  stickyRows?: number
}

/** Le classeur : onglets dans l'ordre d'affichage. */
export type WorkbookSpec = SheetSpec[]
