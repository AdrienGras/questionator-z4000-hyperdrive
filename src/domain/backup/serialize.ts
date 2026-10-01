import { APP_VERSION } from '@/lib/app-version'
import { localDateStamp, slugify } from '@/domain/session/file-name'
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION, type BackupEnvelope } from './envelope'

/** `session` est écrite telle quelle : saine ou endommagée (F31, export brut). */
export function serializeBackup(session: unknown, now: Date = new Date()): string {
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: APP_VERSION,
    exportedAt: now.toISOString(),
    session,
  }
  return `${JSON.stringify(envelope, null, 2)}\n`
}

/**
 * Base du nom de fichier : le `name` s'il n'est pas vide une fois rogné, sinon l'`id`, sinon
 * `'session'`. Ne dépend pas de `lib/db` (`domain/` pur) : sa propre règle de repli.
 */
function backupBaseName(session: unknown): string {
  if (typeof session !== 'object' || session === null) return 'session'
  if ('name' in session && typeof session.name === 'string' && session.name.trim() !== '')
    return session.name
  if ('id' in session && typeof session.id === 'string') return session.id
  return 'session'
}

/** `<slug>-backup-<AAAA-MM-JJ>.json`, date locale (spec F05). */
export function backupFileName(session: unknown, now: Date = new Date()): string {
  return `${slugify(backupBaseName(session))}-backup-${localDateStamp(now)}.json`
}
