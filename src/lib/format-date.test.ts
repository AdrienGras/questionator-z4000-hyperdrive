import { expect, test } from 'vitest'
import { formatDateTime, formatShortDateTime } from './format-date'

// Date construite en heure locale : le test ne dépend pas du fuseau de la machine.
const iso = new Date(2026, 9, 14, 10, 42).toISOString()

test('date courte sans année, en français', () => {
  expect(formatShortDateTime(iso, 'fr')).toBe('14 oct., 10:42')
})

test('date courte sans année, en anglais', () => {
  // ICU met une espace insécable fine avant AM.
  expect(formatShortDateTime(iso, 'en')).toMatch(/^Oct 14, 10:42\sAM$/u)
})

test('date complète inchangée', () => {
  expect(formatDateTime(iso, 'fr')).toContain('2026')
})
