/**
 * Seul importeur de `write-excel-file` (règle dependency-cruiser `xlsx-only-in-lib-xlsx`, D71) :
 * traduit le classeur neutre (`WorkbookSpec`) vers la forme attendue par la bibliothèque.
 * Toujours chargé en `import()` dynamique pour rester hors du bundle initial.
 */
import writeXlsxFile from 'write-excel-file/browser'
import type { Sheet, SheetData } from 'write-excel-file/browser'
import type { Cell, SheetSpec, WorkbookSpec } from '@/domain/export/types'

/** Décalage UTC (minutes, positif à l'ouest de Greenwich) du fuseau local à la date donnée. */
const localOffset = (date: Date): number => date.getTimezoneOffset()

function toCell(cell: Cell, offsetOf: (date: Date) => number): SheetData[number][number] {
  if (cell === null) return null
  if (cell.kind === 'text') {
    // `type: String` explicite : un texte comme `=1+1` ne devient jamais une formule.
    return cell.bold === true
      ? { value: cell.value, type: String, fontWeight: 'bold' }
      : { value: cell.value, type: String }
  }
  if (cell.kind === 'number') {
    return cell.format === undefined
      ? { value: cell.value, type: Number }
      : { value: cell.value, type: Number, format: cell.format }
  }
  // La bibliothèque sérialise les composantes UTC : on décale la date de SON propre offset
  // (heure d'été / d'hiver) pour que le classeur affiche l'heure murale locale.
  return {
    value: new Date(cell.value.getTime() - offsetOf(cell.value) * 60_000),
    type: Date,
    format: cell.format,
  }
}

/** Lignes d'un onglet au format `write-excel-file` (exportée pour les tests). */
export function toSheetData(
  sheet: SheetSpec,
  offsetOf: (date: Date) => number = localOffset,
): SheetData {
  return sheet.rows.map((row) => row.map((cell) => toCell(cell, offsetOf)))
}

/** Onglets au format `write-excel-file` (exportée pour les tests). */
export function toSheets(spec: WorkbookSpec): Sheet<Blob>[] {
  return spec.map((sheet) => ({
    sheet: sheet.name,
    data: toSheetData(sheet),
    columns: sheet.columns,
    ...(sheet.stickyRows === undefined ? {} : { stickyRowsCount: sheet.stickyRows }),
  }))
}

/** Écrit le classeur et déclenche son téléchargement sous `fileName`. */
export async function writeWorkbook(spec: WorkbookSpec, fileName: string): Promise<void> {
  await writeXlsxFile(toSheets(spec)).toFile(fileName)
}
