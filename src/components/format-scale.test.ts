import { expect, test } from 'vitest'
import { formatScale } from './format-scale'

test('barème en français : virgule décimale', () => {
  expect(formatScale([0, 0.5, 1], 'fr', ' · ')).toBe('0 · 0,5 · 1')
})

test('barème en anglais, séparateur de l’aperçu de l’éditeur', () => {
  expect(formatScale([0, 1.5, 3], 'en', ' / ')).toBe('0 / 1.5 / 3')
})
