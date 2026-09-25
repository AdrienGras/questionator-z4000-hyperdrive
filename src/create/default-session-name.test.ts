import { describe, expect, test } from 'vitest'
import { defaultSessionName } from './default-session-name'

describe('defaultSessionName', () => {
  test('format en français : "Oral PHP — 25 septembre 2026"', () => {
    const result = defaultSessionName('Oral PHP', new Date(2026, 8, 25, 12), 'fr')
    expect(result).toBe('Oral PHP — 25 septembre 2026')
  })

  test('format en anglais : "Oral PHP — September 25, 2026"', () => {
    const result = defaultSessionName('Oral PHP', new Date(2026, 8, 25, 12), 'en')
    expect(result).toBe('Oral PHP — September 25, 2026')
  })
})
