import { describe, expect, test } from 'vitest'
import { parseAdjustmentInput } from '@/domain/scoring/adjustment'
import { makeConfig } from '@/testing/student-fixtures'
import { formatAdjustmentInput } from './adjustment-input'

describe('formatAdjustmentInput', () => {
  test('signé, aux décimales des notes finales', () => {
    const config = makeConfig({ rounding: { step: 0.25 } })
    expect(formatAdjustmentInput(0.5, config, 'fr')).toBe('+0,50')
    expect(formatAdjustmentInput(-0.25, config, 'fr')).toBe('−0,25')
    expect(formatAdjustmentInput(0, config, 'fr')).toBe('0,00')
  })

  test('sans séparateur de milliers : relu tel quel, même sur une grande échelle', () => {
    const config = makeConfig({ finalScale: 2000, rounding: { step: 1 } })
    for (const locale of ['fr', 'en'] as const) {
      const shown = formatAdjustmentInput(1000, config, locale)
      expect(shown).toBe('+1000')
      expect(parseAdjustmentInput(shown)).toBe(1000)
    }
  })
})
