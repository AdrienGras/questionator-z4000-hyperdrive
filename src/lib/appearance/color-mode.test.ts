import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  colorModeKey,
  isColorMode,
  readStoredMode,
  resolveColorMode,
  writeStoredMode,
} from './color-mode'

describe('resolveColorMode', () => {
  test.each([
    ['dark', 'light', false, 'dark'],
    ['light', 'dark', true, 'light'],
    ['system', 'light', true, 'dark'],
    ['system', 'dark', false, 'light'],
    [undefined, 'dark', false, 'dark'],
    [undefined, 'light', true, 'light'],
    [undefined, 'system', true, 'dark'],
    [undefined, 'system', false, 'light'],
  ] as const)(
    'choix %s, defaut %s, systeme sombre %s → %s',
    (stored, fallback, systemDark, expected) => {
      expect(resolveColorMode(stored, fallback, systemDark)).toBe(expected)
    },
  )
})

describe('colorModeKey', () => {
  test('cle globale', () => {
    expect(colorModeKey('global')).toBe('questionator:color-mode:global')
  })

  test('une cle par session et par vue', () => {
    expect(colorModeKey({ sessionId: 's1', view: 'examiner' })).toBe(
      'questionator:color-mode:s1:examiner',
    )
    expect(colorModeKey({ sessionId: 's1', view: 'present' })).toBe(
      'questionator:color-mode:s1:present',
    )
    expect(colorModeKey({ sessionId: 's2', view: 'present' })).not.toBe(
      colorModeKey({ sessionId: 's1', view: 'present' }),
    )
  })
})

describe('isColorMode', () => {
  test.each(['light', 'dark', 'system'])('%s est un mode', (value) => {
    expect(isColorMode(value)).toBe(true)
  })
  test.each(['blue', '', null, undefined, 1])("%s n'est pas un mode", (value) => {
    expect(isColorMode(value)).toBe(false)
  })
})

describe('stockage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('relit ce qui a ete ecrit', () => {
    writeStoredMode('k', 'dark')
    expect(readStoredMode('k')).toBe('dark')
  })

  test('cle absente → undefined', () => {
    expect(readStoredMode('absente')).toBeUndefined()
  })

  test('valeur invalide ignoree', () => {
    localStorage.setItem('k', 'blue')
    expect(readStoredMode('k')).toBeUndefined()
  })

  test("un stockage qui leve ne fait pas planter la lecture ni l'ecriture", () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(readStoredMode('k')).toBeUndefined()
    expect(() => writeStoredMode('k', 'dark')).not.toThrow()
  })
})

test('localStorage est vide entre les tests (setup)', () => {
  expect(localStorage.getItem('k')).toBeNull()
})
