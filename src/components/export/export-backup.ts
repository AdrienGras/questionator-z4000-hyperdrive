import { backupFileName, serializeBackup } from '@/domain/backup/serialize'
import { downloadText } from '@/lib/download'

/**
 * Télécharge le backup d'une session, saine ou endommagée (contenu brut, F31), avec le même
 * horodatage pour le nom et l'enveloppe.
 */
export function exportBackup(session: unknown): void {
  const now = new Date()
  downloadText(backupFileName(session, now), serializeBackup(session, now))
}
