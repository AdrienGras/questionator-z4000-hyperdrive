import { downloadText } from '@/lib/download'
import { backupFileName, serializeBackup } from '@/domain/backup/serialize'
import type { Session } from '@/domain/session/types'

/** Télécharge le backup d'une session (même horodatage pour le nom et l'enveloppe). */
export function exportSession(session: Session): void {
  const now = new Date()
  downloadText(backupFileName(session, now), serializeBackup(session, now))
}
