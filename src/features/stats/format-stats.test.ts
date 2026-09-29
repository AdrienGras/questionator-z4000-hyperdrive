import { expect, test } from 'vitest'
import { binLabel, binTick, formatDecimal, formatRate } from '@/features/stats/format-stats'

test('formatDecimal : deux décimales, séparateur de la langue, null → —', () => {
  expect(formatDecimal(13.456, 'fr')).toBe('13,46')
  expect(formatDecimal(13, 'en')).toBe('13.00')
  expect(formatDecimal(null, 'fr')).toBe('—')
})

test('formatRate : pourcentage de 0 à 1 décimale, null → —', () => {
  const fr = new Intl.NumberFormat('fr', { style: 'percent', maximumFractionDigits: 1 })
  expect(formatRate(0.75, 'fr')).toBe(fr.format(0.75))
  expect(formatRate(0.75, 'fr')).toMatch(/^75\s%$/u)
  expect(formatRate(0.3333, 'en')).toBe('33.3%')
  expect(formatRate(-0.25, 'en')).toBe('-25%')
  expect(formatRate(null, 'en')).toBe('—')
})

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
