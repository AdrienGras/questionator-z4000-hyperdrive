import { describe, expect, test } from 'vitest'
import { minimalConfig } from '../test/config-fixtures'
import { SUPPORTED_LOCALES } from '../i18n'
import type { ConfigIssue } from './issues'
import { formatConfigIssue } from './messages'
import { validateConfig } from './validate'

const ZOD_FRAGMENTS = [
  'Invalid input',
  'expected',
  'received',
  'Too small',
  'Too big',
  'Unrecognized',
]

describe('formatConfigIssue', () => {
  test('formate une issue en fr et en en', () => {
    const issue: ConfigIssue = {
      severity: 'error',
      code: 'duplicate_question_id',
      path: ['categories', 1, 'questions', 0, 'id'],
      params: { id: 'a-1', firstPath: 'categories[0].questions[0].id' },
    }
    expect(formatConfigIssue(issue, 'fr')).toContain('« a-1 »')
    expect(formatConfigIssue(issue, 'en')).toContain('"a-1"')
  })

  test('json_syntax avec et sans position', () => {
    const located: ConfigIssue = {
      severity: 'error',
      code: 'json_syntax',
      path: [],
      params: { line: 3, column: 2 },
    }
    const unlocated: ConfigIssue = { severity: 'error', code: 'json_syntax', path: [], params: {} }
    expect(formatConfigIssue(located, 'fr')).toContain('ligne 3')
    expect(formatConfigIssue(unlocated, 'en')).not.toContain('line')
  })

  test('invalid_type fr : formulation sans accord', () => {
    const issue: ConfigIssue = {
      severity: 'error',
      code: 'invalid_type',
      path: ['exam', 'title'],
      params: { expected: 'string' },
    }
    expect(formatConfigIssue(issue, 'fr')).toBe(
      'Type invalide : la valeur doit être une chaîne de caractères.',
    )
  })

  test('missing_absent_value fr : guillemets français partout', () => {
    const issue: ConfigIssue = {
      severity: 'error',
      code: 'missing_absent_value',
      path: ['absent', 'value'],
      params: {},
    }
    expect(formatConfigIssue(issue, 'fr')).toBe(
      '« absent.value » est obligatoire quand « absent.export » vaut « value ».',
    )
  })

  test('not_enough_questions détaille les skips seulement quand il y en a', () => {
    const withSkips: ConfigIssue = {
      severity: 'error',
      code: 'not_enough_questions',
      path: ['categories'],
      params: { total: 3, required: 5, skips: 2 },
    }
    const withoutSkips: ConfigIssue = {
      severity: 'error',
      code: 'not_enough_questions',
      path: ['categories'],
      params: { total: 3, required: 5, skips: 0 },
    }
    expect(formatConfigIssue(withSkips, 'fr')).toBe(
      'La configuration contient 3 question(s), il en faut au moins 5 (3 par étudiant, plus 2 skip(s) autorisé(s)).',
    )
    expect(formatConfigIssue(withoutSkips, 'fr')).toBe(
      'La configuration contient 3 question(s), il en faut au moins 5.',
    )
    expect(formatConfigIssue(withSkips, 'en')).toBe(
      'The configuration has 3 question(s); at least 5 are needed (3 per student, plus 2 allowed skip(s)).',
    )
    expect(formatConfigIssue(withoutSkips, 'en')).toBe(
      'The configuration has 3 question(s); at least 5 are needed.',
    )
  })

  test('unsupported_schema_version invite à recharger la page', () => {
    const issue: ConfigIssue = {
      severity: 'error',
      code: 'unsupported_schema_version',
      path: ['schemaVersion'],
      params: { found: 2, supported: 1 },
    }
    expect(formatConfigIssue(issue, 'fr')).toContain('Rechargez')
    expect(formatConfigIssue(issue, 'en')).toContain('Reload')
  })

  test('aucun message ne contient de texte venant de Zod', () => {
    const config = { ...minimalConfig(), extra: 1, locale: 'de', exam: { title: 3 } }
    const result = validateConfig(JSON.stringify(config), { cssSupports: () => true })
    expect(result.issues.length).toBeGreaterThan(0)
    for (const issue of result.issues) {
      expect(Object.keys(issue).toSorted()).toEqual(['code', 'params', 'path', 'severity'])
      for (const locale of SUPPORTED_LOCALES) {
        const message = formatConfigIssue(issue, locale)
        for (const fragment of ZOD_FRAGMENTS) expect(message).not.toContain(fragment)
      }
    }
  })
})
