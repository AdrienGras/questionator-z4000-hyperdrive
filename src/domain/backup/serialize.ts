import { APP_VERSION } from '@/lib/app-version'
import { localDateStamp, slugify } from '@/domain/session/file-name'
import type { Session } from '@/domain/session/types'
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION, type BackupEnvelope } from './envelope'

export function serializeBackup(session: Session, now: Date = new Date()): string {
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: APP_VERSION,
    exportedAt: now.toISOString(),
    session,
  }
  return `${JSON.stringify(envelope, null, 2)}\n`
}

/** `<slug>-backup-<AAAA-MM-JJ>.json`, date locale (spec F05). */
export function backupFileName(session: Session, now: Date = new Date()): string {
  return `${slugify(session.name)}-backup-${localDateStamp(now)}.json`
}
