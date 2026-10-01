import { describe, expect, test } from 'vitest'
import exampleText from '../../../examples/config.example.json?raw'
import type { ConfigIssue } from '@/domain/config/issues'
import { validateConfig } from '@/domain/config/validate'
import { locateIssue } from './issue-locations'

function issuesOf(text: string): ConfigIssue[] {
  return validateConfig(text, { cssSupports: () => true }).issues
}

function firstIssue(text: string, code: ConfigIssue['code']): ConfigIssue {
  const issue = issuesOf(text).find((i) => i.code === code)
  if (!issue) throw new Error(`issue ${code} absente`)
  return issue
}

function lineOf(text: string, offset: number): number {
  return text.slice(0, offset).split('\n').length
}

describe('locateIssue', () => {
  test('json_syntax : virgule retirée, la plage tombe sur la ligne de l’erreur', () => {
    const text = exampleText.replace('"subject": "PHP",', '"subject": "PHP"')
    const issue = firstIssue(text, 'json_syntax')
    const range = locateIssue(text, issue)
    const expectedLine = 'line' in issue.params ? issue.params.line : undefined
    expect(expectedLine).toBeDefined()
    expect(lineOf(text, range.from)).toBe(expectedLine)
    expect(range.to).toBeGreaterThanOrEqual(range.from)
    expect(range.to).toBeLessThanOrEqual(text.length)
  })

  test('duplicate_question_id : la valeur recopiée, sur la ligne du doublon', () => {
    const result = validateConfig(exampleText, { cssSupports: () => true })
    if (!result.ok) throw new Error('exemple invalide')
    const first = result.config.categories[0]?.questions[0]?.id
    const second = result.config.categories[0]?.questions[1]?.id
    if (!first || !second) throw new Error('exemple inattendu')
    const lines = exampleText.split('\n')
    const index = lines.findIndex((l) => l.includes(`"id": "${second}"`))
    lines[index] = (lines[index] ?? '').replace(second, first)
    const text = lines.join('\n')
    const range = locateIssue(text, firstIssue(text, 'duplicate_question_id'))
    expect(text.slice(range.from, range.to)).toBe(`"${first}"`)
    expect(lineOf(text, range.from)).toBe(index + 1)
  })

  test('padded_id : « facile-001 » suivi d’une espace, la valeur sur sa ligne', () => {
    const result = validateConfig(exampleText, { cssSupports: () => true })
    if (!result.ok) throw new Error('exemple invalide')
    const id = result.config.categories[0]?.questions[0]?.id
    if (!id) throw new Error('exemple inattendu')
    const lines = exampleText.split('\n')
    const index = lines.findIndex((l) => l.includes(`"id": "${id}"`))
    lines[index] = (lines[index] ?? '').replace(`"${id}"`, `"${id} "`)
    const text = lines.join('\n')
    const range = locateIssue(text, firstIssue(text, 'padded_id'))
    expect(text.slice(range.from, range.to)).toBe(`"${id} "`)
    expect(lineOf(text, range.from)).toBe(index + 1)
  })

  test('required : champ manquant, plage de l’objet parent', () => {
    const text = exampleText.replace('    "title": "Oral PHP",\n', '')
    const issue = firstIssue(text, 'required')
    expect(issue.path).toEqual(['exam', 'title'])
    const range = locateIssue(text, issue)
    const slice = text.slice(range.from, range.to)
    expect(slice.startsWith('{')).toBe(true)
    expect(slice.endsWith('}')).toBe(true)
    expect(slice).toContain('"subject": "PHP"')
    expect(slice).not.toContain('"scoring"')
  })

  test('unknown_key : la paire "clé": valeur', () => {
    const text = exampleText.replace('"subject": "PHP",', '"subject": "PHP", "foo": 1,')
    const range = locateIssue(text, firstIssue(text, 'unknown_key'))
    expect(text.slice(range.from, range.to)).toBe('"foo": 1')
  })

  test('chemin vide ou texte inexploitable : plage valide, sans exception', () => {
    const issue = firstIssue(exampleText.replace('"schemaVersion": 1,', ''), 'required')
    for (const text of ['', '[', '   ']) {
      const range = locateIssue(text, { ...issue, path: [] })
      expect(range.from).toBeGreaterThanOrEqual(0)
      expect(range.to).toBeGreaterThanOrEqual(range.from)
      expect(range.to).toBeLessThanOrEqual(text.length)
    }
    expect(locateIssue('', issue)).toEqual({ from: 0, to: 0 })
    const root = locateIssue(exampleText, { ...issue, path: [] })
    expect(root.from).toBe(0)
  })

  test('json_syntax sans position : début du texte', () => {
    const range = locateIssue('{', { severity: 'error', code: 'json_syntax', path: [], params: {} })
    expect(range.from).toBe(0)
  })
})
