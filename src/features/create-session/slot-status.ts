import type { ValidationResult } from '@/domain/config/validate'
import type { CsvParseResult } from '@/domain/students/parse-csv'
import type { FileDropStatus } from '@/features/create-session/components/file-drop-field'
import type { FileSlot } from '@/features/create-session/hooks/use-create-form'

function slotStatus<T extends { issues: readonly unknown[] }>(
  slot: FileSlot<T>,
  hasErrors: (result: T) => boolean,
): FileDropStatus {
  if (slot.kind === 'empty') return 'empty'
  if (slot.kind === 'reading') return 'reading'
  if (slot.kind !== 'loaded') return 'errors' // read-error, load-error
  if (hasErrors(slot.result)) return 'errors'
  return slot.result.issues.length > 0 ? 'warnings' : 'ok'
}

/** État affiché par la zone de dépôt du CSV : une issue `error` rend le fichier invalide. */
export function studentsSlotStatus(slot: FileSlot<CsvParseResult>): FileDropStatus {
  return slotStatus(slot, (result) => result.issues.some((issue) => issue.severity === 'error'))
}

/** État affiché par la zone de dépôt de la config : invalide si la validation échoue. */
export function configSlotStatus(slot: FileSlot<ValidationResult>): FileDropStatus {
  return slotStatus(slot, (result) => !result.ok)
}
