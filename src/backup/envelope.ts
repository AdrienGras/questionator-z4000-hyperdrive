import type { Session } from '../domain/types'

export const BACKUP_FORMAT = 'questionator-backup'
export const BACKUP_FORMAT_VERSION = 1

/** Fichier de backup (D24). */
export type BackupEnvelope = {
  format: typeof BACKUP_FORMAT
  formatVersion: typeof BACKUP_FORMAT_VERSION
  appVersion: string
  exportedAt: string
  session: Session
}
