import { describe, expect, test } from 'vitest'
import { SUPPORTED_LOCALES } from '@/lib/i18n/i18n'
import { csvWarning } from './issues'
import type { CsvIssueParams } from './issues'
import { CSV_ISSUE_MESSAGES, formatCsvIssue } from './messages'

/** Un jeu de paramètres réels par code, pour vérifier que chaque texte est non vide. */
const SAMPLE_PARAMS: CsvIssueParams = {
  csv_syntax: {},
  legacy_encoding: {},
  no_students: {},
  preamble_skipped: { count: 2 },
  single_field_row: {},
  extra_columns: { count: 2 },
  duplicate_student: { firstLine: 2, name: 'Durand Alice' },
}

describe('messages de lecture CSV', () => {
  test.each(SUPPORTED_LOCALES)('chaque code a un texte en %s', (locale) => {
    const dictionary = CSV_ISSUE_MESSAGES[locale]
    // Accès par propriété littérale : le type de chaque appel est connu statiquement, pas de `as`.
    expect(dictionary.csv_syntax(SAMPLE_PARAMS.csv_syntax).length).toBeGreaterThan(0)
    expect(dictionary.legacy_encoding(SAMPLE_PARAMS.legacy_encoding).length).toBeGreaterThan(0)
    expect(dictionary.no_students(SAMPLE_PARAMS.no_students).length).toBeGreaterThan(0)
    expect(dictionary.preamble_skipped(SAMPLE_PARAMS.preamble_skipped).length).toBeGreaterThan(0)
    expect(dictionary.single_field_row(SAMPLE_PARAMS.single_field_row).length).toBeGreaterThan(0)
    expect(dictionary.extra_columns(SAMPLE_PARAMS.extra_columns).length).toBeGreaterThan(0)
    expect(dictionary.duplicate_student(SAMPLE_PARAMS.duplicate_student).length).toBeGreaterThan(0)
  })

  test('inclut le nombre de lignes de préambule', () => {
    expect(formatCsvIssue(csvWarning('preamble_skipped', { count: 2 }), 'fr')).toContain('2')
  })
})
