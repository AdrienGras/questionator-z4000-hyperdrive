import { describe, expect, test } from 'vitest'
import css from '../index.css?raw'
import { minimalConfig } from '../test/config-fixtures'
import { ConfigSchema, THEME_TOKENS } from './schema'

function rootCssVariables(source: string): string[] {
  const rootBlock = /^:root\s*\{([^}]*)\}/m.exec(source)?.[1] ?? ''
  return [...rootBlock.matchAll(/--([a-z0-9-]+)\s*:/g)].map((match) => match[1] ?? '')
}

describe('ConfigSchema', () => {
  test('THEME_TOKENS correspond exactement aux variables du bloc :root de src/index.css', () => {
    const variables = rootCssVariables(css)
    expect(variables).toHaveLength(THEME_TOKENS.length)
    expect(new Set(variables)).toEqual(new Set(THEME_TOKENS))
  })

  test('accepte la config minimale et le champ $schema', () => {
    expect(ConfigSchema.safeParse(minimalConfig()).success).toBe(true)
    expect(ConfigSchema.safeParse({ ...minimalConfig(), $schema: 'https://x' }).success).toBe(true)
  })

  test('refuse une clé inconnue à la racine, dans une question et dans un thème', () => {
    const atRoot = { ...minimalConfig(), extra: 1 }
    const inQuestion = minimalConfig()
    Object.assign(inQuestion.categories[0]!.questions[0]!, { titel: 'faute de frappe' })
    const inTheme = { ...minimalConfig(), theme: { dark: { 'primary-fg': 'red' } } }
    for (const input of [atRoot, inQuestion, inTheme]) {
      const result = ConfigSchema.safeParse(input)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.code).toBe('unrecognized_keys')
    }
  })

  test('schemaVersion est la constante 1', () => {
    expect(ConfigSchema.safeParse({ ...minimalConfig(), schemaVersion: 2 }).success).toBe(false)
  })

  test('les chaînes obligatoires vides ou blanches sont refusées avec params.code empty_string', () => {
    const result = ConfigSchema.safeParse({ ...minimalConfig(), exam: { title: '   ' } })
    const issue = result.error?.issues[0]
    expect(issue?.code).toBe('custom')
    expect(issue && 'params' in issue ? issue.params : undefined).toEqual({ code: 'empty_string' })
  })

  test('une valeur CSS contenant ; { } ou < est refusée avec params.code invalid_css_shape', () => {
    for (const value of ['red;', 'a{', 'b}', '<x', '']) {
      const input = { ...minimalConfig(), theme: { light: { primary: value } } }
      const issue = ConfigSchema.safeParse(input).error?.issues[0]
      expect(issue && 'params' in issue ? issue.params : undefined).toEqual({
        code: 'invalid_css_shape',
      })
    }
  })

  test("aucun défaut n'est appliqué par le schéma (la normalisation s'en charge)", () => {
    const result = ConfigSchema.safeParse(minimalConfig())
    expect(result.data?.presentation).toBeUndefined()
    expect(result.data?.scoring.rounding).toBeUndefined()
  })
})
