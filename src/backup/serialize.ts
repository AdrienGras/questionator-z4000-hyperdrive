import { APP_VERSION } from '../app-version'
import type { Session } from '../domain/types'
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
 * Retire les tirets en tête/queue sans alternance ancrée des deux côtés (`^-+|-+$`) : signalée
 * super-linéaire par SonarQube (voir QUIRKS), on la remplace par deux passes ancrées séparées.
 */
function trimDashes(value: string): string {
  return value.replace(/^-+/, '').replace(/-+$/, '')
}

function slugify(name: string): string {
  const slug = trimDashes(
    name
      .normalize('NFD')
      .replaceAll(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-'),
  )
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, '')
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
