import { describe, expect, test } from 'vitest'
import { minimalConfig } from '@/testing/config-fixtures'
import { formatPath } from './issues'
import { validateConfig } from './validate'

const deps = { cssSupports: () => true }
const json = (value: unknown) => JSON.stringify(value)

describe('validateConfig', () => {
  test('config valide → ok, config normalisée, aucune issue', () => {
    const result = validateConfig(json(minimalConfig()), deps)
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
    if (!result.ok) throw new Error('unreachable : result.ok vérifié ci-dessus')
    expect(result.config.categories[0]?.questions[0]?.title).toBe('Question A1')
  })

  test('JSON mal formé → json_syntax seul', () => {
    const result = validateConfig('{\n "a": 1,\n }', deps)
    expect(result).toEqual({
      ok: false,
      issues: [
        { severity: 'error', code: 'json_syntax', path: [], params: { line: 3, column: 2 } },
      ],
    })
  })

  test('schemaVersion future → seule issue, même avec des champs inconnus', () => {
    const result = validateConfig(json({ schemaVersion: 2, nouveauChamp: true }), deps)
    expect(result).toEqual({
      ok: false,
      issues: [
        {
          severity: 'error',
          code: 'unsupported_schema_version',
          path: ['schemaVersion'],
          params: { found: 2, supported: 1 },
        },
      ],
    })
  })

  test('racine qui n’est pas un objet → invalid_type à la racine', () => {
    for (const text of ['[]', 'null', '"x"', '42']) {
      const result = validateConfig(text, deps)
      expect(result.ok).toBe(false)
      expect(result.issues).toEqual([
        { severity: 'error', code: 'invalid_type', path: [], params: { expected: 'object' } },
      ])
    }
  })

  test('clés inconnues à la racine, dans une question et dans un thème ; $schema accepté', () => {
    const base = minimalConfig()
    const config = {
      ...base,
      $schema: 'https://x',
      extra: 1,
      categories: [
        {
          ...base.categories[0]!,
          questions: [{ ...base.categories[0]!.questions[0]!, reponse: 'faute' }],
        },
      ],
      theme: { light: { primaire: 'red' } },
    }
    const result = validateConfig(json(config), deps)
    const found = result.issues.map((issue) => `${issue.code} ${formatPath(issue.path)}`).toSorted()
    expect(found).toEqual(
      [
        'unknown_key extra',
        'unknown_key theme.light.primaire',
        'unknown_key categories[0].questions[0].reponse',
      ].toSorted(),
    )
  })

  test('erreur structurelle → règles croisées non exécutées', () => {
    const base = minimalConfig()
    const config = {
      ...base,
      exam: {},
      categories: [...base.categories, { id: 'a' }],
    }
    const result = validateConfig(json(config), deps)
    expect(result.issues.some((issue) => issue.code === 'duplicate_category_id')).toBe(false)
  })

  test('avertissements seuls → ok avec les avertissements', () => {
    const config = minimalConfig()
    config.categories[0]!.icon = 'licorne'
    const result = validateConfig(json(config), deps)
    expect(result.ok).toBe(true)
    expect(result.issues.map((issue) => issue.code)).toEqual(['unknown_icon'])
  })

  test('erreur de règle → ok false avec erreurs et avertissements', () => {
    const config = minimalConfig()
    config.categories[0]!.icon = 'licorne'
    config.categories[0]!.color = 'pas-une-couleur'
    const result = validateConfig(json(config), { cssSupports: () => false })
    expect(result.ok).toBe(false)
    expect(result.issues.map((issue) => issue.code).toSorted()).toEqual([
      'invalid_css_value',
      'unknown_icon',
    ])
  })
})
