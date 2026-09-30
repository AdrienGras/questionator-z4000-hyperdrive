import { expect, test } from 'vitest'
import { formatDecimal, formatRate } from '@/features/stats/format-stats'

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
