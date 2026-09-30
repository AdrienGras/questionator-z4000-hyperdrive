import { expect, test } from 'vitest'
import { binLabel, binTick, compositionLabel, reasonsLabel } from './labels'

const times = (label: string, count: number) => `${label} ×${count}`

test('binLabel : demi-ouvert à droite, dernière barre fermée, virgule selon la langue', () => {
  const bin = { from: 2, to: 2.5, count: 0 }
  expect(binLabel({ from: 0, to: 1, count: 0 }, false, 'fr')).toBe('[0 ; 1[')
  expect(binLabel(bin, true, 'fr')).toBe('[2 ; 2,5]')
  expect(binLabel(bin, true, 'en')).toBe('[2 ; 2.5]')
  expect(binLabel({ from: 0.333, to: 0.6667, count: 0 }, false, 'en')).toBe('[0.333 ; 0.667[')
})

test('binTick : « a–b »', () => {
  expect(binTick({ from: 2, to: 2.5, count: 1 }, 'fr')).toBe('2–2,5')
})

test('reasonsLabel : « x ×n » séparés par une virgule, null → libellé sans motif', () => {
  expect(
    reasonsLabel(
      [
        { reason: 'Hors programme', count: 2 },
        { reason: null, count: 1 },
      ],
      'sans motif',
      times,
    ),
  ).toBe('Hors programme ×2, sans motif ×1')
  expect(reasonsLabel([], 'sans motif', times)).toBe('')
})

test('compositionLabel : parts séparées par « · »', () => {
  expect(
    compositionLabel(
      [
        { label: 'Facile', count: 2 },
        { label: 'Difficile', count: 1 },
      ],
      times,
    ),
  ).toBe('Facile ×2 · Difficile ×1')
})
