import type { CsvParseResult } from '@/domain/students/parse-csv'
import type { FileDropStatus } from '@/components/file-drop-field'
import { slotStatus, type FileSlot } from '@/components/file-slot'

/** État affiché par la zone de dépôt du CSV : une issue `error` rend le fichier invalide. */
export function studentsSlotStatus(slot: FileSlot<CsvParseResult>): FileDropStatus {
  return slotStatus(slot, (result) => result.issues.some((issue) => issue.severity === 'error'))
}
