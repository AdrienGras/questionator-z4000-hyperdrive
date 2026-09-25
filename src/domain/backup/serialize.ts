import { APP_VERSION } from '@/lib/app-version'
import type { Session } from '@/domain/session/types'
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION, type BackupEnvelope } from './envelope'

const SLUG_MAX_LENGTH = 60

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

/**
 * Retire au plus un tiret de tête et un de queue, sans regex ancrée en fin (signalée
 * super-linéaire par SonarQube, voir QUIRKS) : après le `replaceAll` de `slugify`, les tirets
 * consécutifs sont déjà réduits à un seul, donc `startsWith`/`endsWith` + `slice` suffisent.
 */
function trimEdgeDash(value: string): string {
  const withoutLeading = value.startsWith('-') ? value.slice(1) : value
  return withoutLeading.endsWith('-') ? withoutLeading.slice(0, -1) : withoutLeading
}

function slugify(name: string): string {
  const collapsed = trimEdgeDash(
    name
      .normalize('NFD')
      .replaceAll(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-'),
  )
  // La troncature peut faire retomber un tiret interne en position de queue : on le retire aussi.
  const slug = trimEdgeDash(collapsed.slice(0, SLUG_MAX_LENGTH))
  return slug === '' ? 'session' : slug
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function localDate(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** `<slug>-backup-<AAAA-MM-JJ>.json`, date locale (spec F05). */
export function backupFileName(session: Session, now: Date = new Date()): string {
  return `${slugify(session.name)}-backup-${localDate(now)}.json`
}
