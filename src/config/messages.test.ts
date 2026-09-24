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
