import { describe, expect, test } from 'vitest'
import type { CsvParseResult } from '@/domain/students/parse-csv'
import { studentsSlotStatus } from './slot-status'

const student = { lastName: 'Dupont', firstName: 'Marie', line: 2 }
const csv = (issues: CsvParseResult['issues']): CsvParseResult => ({ students: [student], issues })

const studentsLoaded = (result: CsvParseResult) =>
  studentsSlotStatus({ kind: 'loaded', fileName: 'a.csv', result })

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
