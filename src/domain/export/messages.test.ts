import { describe, expect, test } from 'vitest'
import { EXPORT_MESSAGES, SHEET_NAME_KEYS, exportText } from './messages'

describe('EXPORT_MESSAGES', () => {
  test('chaque clé fr a son pendant en, et inversement', () => {
    expect(Object.keys(EXPORT_MESSAGES.en).toSorted()).toEqual(
      Object.keys(EXPORT_MESSAGES.fr).toSorted(),
    )
  })

  test.each(['fr', 'en'] as const)('noms d’onglets valides pour Excel (%s)', (locale) => {
    const names = SHEET_NAME_KEYS.map((key) => exportText(locale, key, {}))
    expect(new Set(names).size).toBe(5)
    for (const name of names) {
      expect(name.length).toBeGreaterThan(0)
      expect(name.length).toBeLessThanOrEqual(31)
      expect(name).not.toMatch(/[:\\/?*[\]]/)
    }
  })

  test('libellés exacts', () => {
    expect(exportText('fr', 'sheet_summary', {})).toBe('Synthèse')
    expect(exportText('fr', 'sheet_detail', {})).toBe('Détail des questions')
    expect(exportText('fr', 'times', { label: 'Hors programme', count: 2 })).toBe(
      'Hors programme ×2',
    )
    expect(exportText('fr', 'no_reason', {})).toBe('sans motif')
    expect(exportText('en', 'no_reason', {})).toBe('no reason')
  })
})
