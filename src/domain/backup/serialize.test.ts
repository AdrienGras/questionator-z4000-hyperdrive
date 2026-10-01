import { afterEach, describe, expect, test, vi } from 'vitest'
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

describe('export brut (F31)', () => {
  test('serializeBackup écrit une session quelconque telle quelle', () => {
    const text = serializeBackup({ id: 'x', foo: 1 }, NOW)
    expect(text).toContain('"session": {\n    "id": "x",\n    "foo": 1\n  }')
    expect(JSON.parse(text).session).toEqual({ id: 'x', foo: 1 })
  })

  test.each([
    [{ name: 42, id: 'abc' }, 'abc'],
    [{ name: '  ' }, 'session'],
    [{ name: '', id: 7 }, 'session'],
    ['pas un objet', 'session'],
    [null, 'session'],
  ])('backupFileName(%j) → %s', (session, slug) => {
    expect(backupFileName(session, NOW)).toBe(`${slug}-backup-2026-09-25.json`)
  })
})

describe('date du nom de fichier : locale, pas UTC (#87)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('à 00:30 à Paris, le fichier porte la date du jour local, pas celle de la veille en UTC', () => {
    // Fuseau fixé dans le test : la CI tourne en UTC, où local et UTC se confondent. Node relit
    // `process.env.TZ` à chaque affectation (pool `forks` de Vitest : un processus par worker).
    vi.stubEnv('TZ', 'Europe/Paris')
    const now = new Date('2026-09-24T22:30:00.000Z')
    // Garde : si le fuseau n'était pas appliqué, le test ne prouverait rien.
    expect(now.getHours()).toBe(0)
    expect(now.toISOString().slice(0, 10)).toBe('2026-09-24')
    expect(backupFileName(makeSession({ name: 'Oral' }), now)).toBe('oral-backup-2026-09-25.json')
  })
})
