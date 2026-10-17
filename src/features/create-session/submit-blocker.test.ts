import { describe, expect, test } from 'vitest'
import type { FileSlot } from '@/components/file-slot'
import { configError } from '@/domain/config/issues'
import { validateConfig, type ValidationResult } from '@/domain/config/validate'
import { csvError } from '@/domain/students/issues'
import type { CsvParseResult } from '@/domain/students/parse-csv'
import type { DbStatus } from '@/lib/db/db'
import { minimalConfig } from '@/testing/config-fixtures'
import { submitBlocker } from './submit-blocker'

type Form = Parameters<typeof submitBlocker>[0]

const csvOk: FileSlot<CsvParseResult> = {
  kind: 'loaded',
  fileName: 'e.csv',
  result: { students: [], issues: [] },
}
const csvInvalid: FileSlot<CsvParseResult> = {
  kind: 'loaded',
  fileName: 'e.csv',
  result: { students: [], issues: [csvError('no_students', {})] },
}
const configOk: FileSlot<ValidationResult> = {
  kind: 'loaded',
  fileName: 'c.json',
  result: validateConfig(JSON.stringify(minimalConfig()), { cssSupports: () => true }),
}
const configInvalid: FileSlot<ValidationResult> = {
  kind: 'loaded',
  fileName: 'c.json',
  result: { ok: false, issues: [configError('required', ['exam'], { field: 'exam' })] },
}

const ready: Form = { students: csvOk, config: configOk, name: 'Oral', submitting: false }

function blocker(form: Partial<Form>, status: DbStatus = 'open') {
  return submitBlocker({ ...ready, ...form }, status)
}

describe('submitBlocker', () => {
  test('rien ne bloque : undefined', () => {
    expect(blocker({})).toBeUndefined()
  })

  test.each([
    ['base indisponible', {}, 'unavailable', 'db'],
    ['base périmée', {}, 'outdated', 'db'],
    ['CSV en erreur', { students: csvInvalid }, 'open', 'students'],
    ['CSV illisible', { students: { kind: 'read-error', fileName: 'e.csv' } }, 'open', 'students'],
    ['config invalide', { config: configInvalid }, 'open', 'config'],
    ['config illisible', { config: { kind: 'read-error', fileName: 'c.json' } }, 'open', 'config'],
    ['validateur absent', { config: { kind: 'load-error', fileName: 'c.json' } }, 'open', 'config'],
    ['liste manquante', { students: { kind: 'empty' } }, 'open', 'files'],
    ['config manquante', { config: { kind: 'empty' } }, 'open', 'files'],
    ['nom vide', { name: '  ' }, 'open', 'name'],
  ] as const)('%s', (_label, form, status, expected) => {
    expect(blocker(form as Partial<Form>, status)).toBe(expected)
  })

  test('plusieurs causes : la première dans l’ordre', () => {
    expect(blocker({ config: configInvalid, name: '' }, 'unavailable')).toBe('db')
    expect(blocker({ students: csvInvalid, name: '' })).toBe('students')
    expect(blocker({ config: configInvalid, students: { kind: 'empty' } })).toBe('config')
  })

  test('lecture ou écriture en cours : aucune phrase', () => {
    expect(blocker({ students: { kind: 'reading', fileName: 'e.csv' }, name: '' })).toBeUndefined()
    expect(blocker({ submitting: true })).toBeUndefined()
  })
})
