import { describe, expect, test } from 'vitest'
import { APP_VERSION } from '@/lib/app-version'
import { makeSession } from '@/testing/session-fixtures'
import { backupFileName, serializeBackup } from './serialize'

const NOW = new Date(2026, 8, 25, 23, 30) // 25 sept. 2026, 23:30 locale

describe('serializeBackup', () => {
  test('enveloppe complète, session telle quelle', () => {
    const session = makeSession()
    const text = serializeBackup(session, NOW)
    expect(text.endsWith('\n')).toBe(true)
    expect(JSON.parse(text)).toEqual({
      format: 'questionator-backup',
      formatVersion: 1,
      appVersion: APP_VERSION,
      exportedAt: NOW.toISOString(),
      session,
    })
  })
})

describe('backupFileName', () => {
  test.each([
    ['Oral PHP — 25/09/2026', 'oral-php-25-09-2026'],
    ['Élève  Ça   Marche !', 'eleve-ca-marche'],
    ['---', 'session'],
    ['🎓🎓', 'session'],
    ['a'.repeat(80), 'a'.repeat(60)],
    [`${'a'.repeat(59)} b`, 'a'.repeat(59)],
  ])('%s → %s', (name, slug) => {
    expect(backupFileName(makeSession({ name }), NOW)).toBe(`${slug}-backup-2026-09-25.json`)
  })
})
