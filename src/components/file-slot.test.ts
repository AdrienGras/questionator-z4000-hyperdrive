import { describe, expect, test } from 'vitest'
import { normalize } from '@/domain/config/normalize'
import type { ValidationResult } from '@/domain/config/validate'
import { minimalConfig } from '@/testing/config-fixtures'
import { configSlotStatus } from './file-slot'

const config = normalize(minimalConfig())

const configLoaded = (result: ValidationResult) =>
  configSlotStatus({ kind: 'loaded', fileName: 'c.json', result })

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
