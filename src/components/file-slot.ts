import type { ValidationResult } from '@/domain/config/validate'
import type { FileDropStatus } from '@/components/file-drop-field'

/** Emplacement d'un fichier déposé : lecture, échec, ou résultat de l'analyse. */
export type FileSlot<T> =
  | { kind: 'empty' }
  | { kind: 'reading'; fileName: string }
  | { kind: 'read-error'; fileName: string }
  | { kind: 'load-error'; fileName: string } // config : échec du chargement du validateur
  | { kind: 'loaded'; fileName: string; result: T }

/** État affiché par une zone de dépôt, selon l'emplacement et la gravité de ses issues. */
export function slotStatus<T extends { issues: readonly unknown[] }>(
  slot: FileSlot<T>,
  hasErrors: (result: T) => boolean,
): FileDropStatus {
  if (slot.kind === 'empty') return 'empty'
  if (slot.kind === 'reading') return 'reading'
  if (slot.kind !== 'loaded') return 'errors' // read-error, load-error
  if (hasErrors(slot.result)) return 'errors'
  return slot.result.issues.length > 0 ? 'warnings' : 'ok'
}

/** État affiché par la zone de dépôt de la config : invalide si la validation échoue. */
export function configSlotStatus(slot: FileSlot<ValidationResult>): FileDropStatus {
  return slotStatus(slot, (result) => !result.ok)
}
