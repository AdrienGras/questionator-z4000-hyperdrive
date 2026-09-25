import { describe, expect, test } from 'vitest'
import { normalize } from '@/domain/config/normalize'
import type { ValidationResult } from '@/domain/config/validate'
import type { CsvParseResult } from '@/domain/students/parse-csv'
import { minimalConfig } from '@/testing/config-fixtures'
import { configSlotStatus, studentsSlotStatus } from './slot-status'

const student = { lastName: 'Dupont', firstName: 'Marie', line: 2 }
const csv = (issues: CsvParseResult['issues']): CsvParseResult => ({ students: [student], issues })

const config = normalize(minimalConfig())

const studentsLoaded = (result: CsvParseResult) =>
  studentsSlotStatus({ kind: 'loaded', fileName: 'a.csv', result })

const configLoaded = (result: ValidationResult) =>
  configSlotStatus({ kind: 'loaded', fileName: 'c.json', result })

describe('studentsSlotStatus', () => {
  test('vide, lecture, échec de lecture', () => {
    expect(studentsSlotStatus({ kind: 'empty' })).toBe('empty')
    expect(studentsSlotStatus({ kind: 'reading', fileName: 'a.csv' })).toBe('reading')
    expect(studentsSlotStatus({ kind: 'read-error', fileName: 'a.csv' })).toBe('errors')
  })

  test('chargé : ok, avertissements, erreurs', () => {
    expect(studentsLoaded(csv([]))).toBe('ok')
    expect(
      studentsLoaded(csv([{ severity: 'warning', code: 'single_field_row', line: 3, params: {} }])),
    ).toBe('warnings')
    expect(
      studentsLoaded(
        csv([
          { severity: 'warning', code: 'single_field_row', line: 3, params: {} },
          { severity: 'error', code: 'no_students', params: {} },
        ]),
      ),
    ).toBe('errors')
  })
})

describe('configSlotStatus', () => {
  test('vide, lecture, échecs de lecture et de chargement du validateur', () => {
    expect(configSlotStatus({ kind: 'empty' })).toBe('empty')
    expect(configSlotStatus({ kind: 'reading', fileName: 'c.json' })).toBe('reading')
    expect(configSlotStatus({ kind: 'read-error', fileName: 'c.json' })).toBe('errors')
    expect(configSlotStatus({ kind: 'load-error', fileName: 'c.json' })).toBe('errors')
  })

  test('chargé : ok, avertissements, invalide', () => {
    expect(configLoaded({ ok: true, config, issues: [] })).toBe('ok')
    expect(
      configLoaded({
        ok: true,
        config,
        issues: [
          {
            severity: 'warning',
            code: 'unknown_icon',
            path: ['categories', 0, 'icon'],
            params: { icon: 'x' },
          },
        ],
      }),
    ).toBe('warnings')
    expect(configLoaded({ ok: false, issues: [] })).toBe('errors')
  })
})
