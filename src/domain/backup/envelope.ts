export const BACKUP_FORMAT = 'questionator-backup'
export const BACKUP_FORMAT_VERSION = 1

/** Fichier de backup (D24). `session` n'est validée qu'à la lecture (`parseBackup`, F31). */
export type BackupEnvelope = {
  format: typeof BACKUP_FORMAT
  formatVersion: typeof BACKUP_FORMAT_VERSION
  appVersion: string
  exportedAt: string
  session: unknown
}
