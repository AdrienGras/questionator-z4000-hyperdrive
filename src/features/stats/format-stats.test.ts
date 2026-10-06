import { expect, test } from 'vitest'
import { formatDecimal } from '@/features/stats/format-stats'

test('formatDecimal : deux décimales, séparateur de la langue, null → —', () => {
  expect(formatDecimal(13.456, 'fr')).toBe('13,46')
  expect(formatDecimal(13, 'en')).toBe('13.00')
  expect(formatDecimal(null, 'fr')).toBe('—')
})
