import { downloadText } from '@/backup/download'
import { backupFileName, serializeBackup } from '@/backup/serialize'
import type { Session } from '@/domain/types'

/** Télécharge le backup d'une session (même horodatage pour le nom et l'enveloppe). */
export function exportSession(session: Session): void {
  const now = new Date()
  downloadText(backupFileName(session, now), serializeBackup(session, now))
}
