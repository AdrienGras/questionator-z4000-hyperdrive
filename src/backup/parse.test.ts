import { describe, expect, test } from 'vitest'
import { minimalConfig } from '../test/config-fixtures'
import { acceptAllCss, richSession } from '../test/backup-fixtures'
import { makeSession } from '../test/session-fixtures'
import { makeStudent } from '../test/student-fixtures'
import { parseBackup } from './parse'
import { serializeBackup } from './serialize'

const deps = { cssSupports: acceptAllCss }

function envelopeWith(session: unknown, overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: 'questionator-backup',
    formatVersion: 1,
    appVersion: '0.1.0',
    exportedAt: '2026-09-25T14:00:00.000Z',
    session,
    ...overrides,
  })
}

function issueCodes(text: string) {
  const result = parseBackup(text, deps)
  return result.ok ? [] : result.issues.map((issue) => issue.code)
}

describe('parseBackup', () => {
  test('aller-retour identique sur une session riche', () => {
    const session = richSession()
    expect(parseBackup(serializeBackup(session), deps)).toEqual({ ok: true, session })
  })

  test('JSON invalide', () => {
    expect(issueCodes('{ pas du json')).toEqual(['json_syntax'])
  })

  test.each([
    ['tableau', '[]'],
    ['null', 'null'],
    ['objet quelconque', '{"a":1}'],
    ['config Questionator', JSON.stringify(minimalConfig())],
    ['format inconnu', envelopeWith(makeSession(), { format: 'autre' })],
  ])('pas un backup (%s) : une seule issue unknown_format', (_label, text) => {
    expect(issueCodes(text)).toEqual(['unknown_format'])
  })

  test('formatVersion futur : issue unique', () => {
    const result = parseBackup(envelopeWith({ nimporte: 'quoi' }, { formatVersion: 2 }), deps)
    expect(result).toEqual({
      ok: false,
      issues: [
        {
          severity: 'error',
          code: 'unsupported_format_version',
          path: ['formatVersion'],
          params: { found: 2, supported: 1 },
        },
      ],
    })
  })

  test("clé inconnue dans l'enveloppe", () => {
    expect(issueCodes(envelopeWith(makeSession(), { extra: true }))).toEqual(['unknown_key'])
  })

  test('session invalide', () => {
    const { name: _name, ...withoutName } = makeSession()
    const result = parseBackup(envelopeWith(withoutName), deps)
    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.issues).toContainEqual(
      expect.objectContaining({ code: 'required', path: ['session', 'name'] }),
    )
  })

  test('config invalide : chemin préfixé', () => {
    const session = makeSession()
    const text = envelopeWith({ ...session, config: { ...session.config, categories: [] } })
    const result = parseBackup(text, deps)
    expect(result.ok).toBe(false)
    expect(
      result.ok
        ? []
        : result.issues.every((issue) => issue.path[0] === 'session' && issue.path[1] === 'config'),
    ).toBe(true)
  })

  test('schemaVersion futur : issue unique', () => {
    const session = makeSession()
    expect(
      issueCodes(envelopeWith({ ...session, config: { ...session.config, schemaVersion: 2 } })),
    ).toEqual(['unsupported_schema_version'])
  })

  test('règles croisées remontées', () => {
    expect(issueCodes(envelopeWith(makeSession({ students: [makeStudent([1.5])] })))).toEqual([
      'score_not_in_scale',
    ])
  })

  test('config désordonnée : ressort normalisée', () => {
    const session = makeSession()
    const [first] = session.config.categories
    const second = {
      ...first!,
      id: 'b',
      label: 'B',
      order: 2,
      questions: [{ id: 'b-1', title: 'B1', tags: [], prompt: 'B1' }],
    }
    const shuffled = { ...session.config, categories: [second, { ...first!, order: 1 }] }
    const result = parseBackup(envelopeWith({ ...session, config: shuffled }), deps)
    expect(result.ok ? result.session.config.categories.map((c) => c.id) : []).toEqual(['a', 'b'])
  })

  test('avertissements de config ignorés', () => {
    const session = makeSession()
    const withUnknownIcon = {
      ...session.config,
      categories: session.config.categories.map((c) => ({ ...c, icon: 'icone-inexistante' })),
    }
    expect(parseBackup(envelopeWith({ ...session, config: withUnknownIcon }), deps).ok).toBe(true)
  })
})
