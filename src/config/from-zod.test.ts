import { describe, expect, test } from 'vitest'
import { minimalConfig } from '../test/config-fixtures'
import { fromZodIssues } from './from-zod'
import { ConfigSchema } from './schema'

function convert(input: unknown) {
  const result = ConfigSchema.safeParse(input)
  if (result.success) throw new Error('la config aurait dû être refusée')
  return fromZodIssues(result.error.issues, input)
}

describe('fromZodIssues', () => {
  test('champ manquant → required', () => {
    const withoutExam: Record<string, unknown> = { ...minimalConfig() }
    delete withoutExam.exam
    expect(convert(withoutExam)).toEqual([
      { severity: 'error', code: 'required', path: ['exam'], params: {} },
    ])
  })

  test('schemaVersion absent → required, pas invalid_enum', () => {
    const withoutVersion: Record<string, unknown> = { ...minimalConfig() }
    delete withoutVersion.schemaVersion
    expect(convert(withoutVersion)).toEqual([
      { severity: 'error', code: 'required', path: ['schemaVersion'], params: {} },
    ])
  })

  test('mauvais type → invalid_type avec le type attendu', () => {
    const input = { ...minimalConfig(), exam: { title: 42 } }
    expect(convert(input)).toEqual([
      {
        severity: 'error',
        code: 'invalid_type',
        path: ['exam', 'title'],
        params: { expected: 'string' },
      },
    ])
  })

  test('nombre non entier → not_integer ; chaîne à la place d’un entier → invalid_type integer', () => {
    const decimal = minimalConfig()
    decimal.scoring.questionsPerStudent = 1.5
    expect(convert(decimal)[0]).toMatchObject({ code: 'not_integer' })
    const text = {
      ...minimalConfig(),
      scoring: { ...minimalConfig().scoring, questionsPerStudent: 'x' },
    }
    expect(convert(text)[0]).toMatchObject({
      code: 'invalid_type',
      params: { expected: 'integer' },
    })
  })

  test('une issue unknown_key par clé inconnue, la clé en fin de chemin', () => {
    const input = { ...minimalConfig(), foo: 1, bar: 2 }
    expect(convert(input)).toEqual([
      { severity: 'error', code: 'unknown_key', path: ['foo'], params: { key: 'foo' } },
      { severity: 'error', code: 'unknown_key', path: ['bar'], params: { key: 'bar' } },
    ])
  })

  test('valeur hors énumération → invalid_enum avec les options', () => {
    const input = { ...minimalConfig(), locale: 'de' }
    expect(convert(input)).toEqual([
      {
        severity: 'error',
        code: 'invalid_enum',
        path: ['locale'],
        params: { options: '"fr", "en"' },
      },
    ])
  })

  test('bornes → too_small / too_big avec inclusive', () => {
    const small = minimalConfig()
    small.scoring.questionsPerStudent = 0
    expect(convert(small)[0]).toMatchObject({
      code: 'too_small',
      params: { minimum: 0, inclusive: false },
    })
    const big = {
      ...minimalConfig(),
      scoring: { ...minimalConfig().scoring, rounding: { decimals: 4 } },
    }
    expect(convert(big)[0]).toMatchObject({
      code: 'too_big',
      path: ['scoring', 'rounding', 'decimals'],
      params: { maximum: 3, inclusive: true },
    })
  })

  test('raffinements du schéma → empty_string et invalid_css_shape', () => {
    expect(convert({ ...minimalConfig(), exam: { title: ' ' } })[0]).toMatchObject({
      code: 'empty_string',
      path: ['exam', 'title'],
    })
    expect(convert({ ...minimalConfig(), theme: { light: { ring: 'a;b' } } })[0]).toMatchObject({
      code: 'invalid_css_shape',
      path: ['theme', 'light', 'ring'],
    })
  })

  test('code Zod non prévu → invalid_value, sans aucun texte Zod', () => {
    const issues = fromZodIssues(
      [{ code: 'invalid_union', errors: [], path: ['x'], message: 'Invalid input' }],
      {},
    )
    expect(issues).toEqual([{ severity: 'error', code: 'invalid_value', path: ['x'], params: {} }])
  })

  test('aucune issue convertie ne porte de propriété message', () => {
    const input = { ...minimalConfig(), foo: 1, exam: { title: 3 }, locale: 'de' }
    for (const issue of convert(input)) {
      expect(Object.keys(issue).toSorted()).toEqual(['code', 'params', 'path', 'severity'])
    }
  })
})
