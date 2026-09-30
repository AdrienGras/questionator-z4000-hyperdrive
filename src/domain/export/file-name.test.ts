import { describe, expect, test } from 'vitest'
import { makeSession } from '@/testing/session-fixtures'
import { workbookFileName } from './file-name'

const NOW = new Date(2026, 8, 30, 23, 30) // 30 sept. 2026, 23:30 locale

describe('workbookFileName', () => {
  test('slug du nom et date locale', () => {
    expect(workbookFileName(makeSession({ name: 'Oral PHP — Jury 2' }), NOW)).toBe(
      'oral-php-jury-2-2026-09-30.xlsx',
    )
  })

  test('nom sans caractère alphanumérique → repli « session »', () => {
    expect(workbookFileName(makeSession({ name: '—' }), NOW)).toBe('session-2026-09-30.xlsx')
  })
})
