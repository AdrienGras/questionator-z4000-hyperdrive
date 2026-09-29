import { describe, expect, test } from 'vitest'
import { MAX_REASON_LENGTH, normalizeReason } from './reason'

describe('normalizeReason', () => {
  test('undefined reste undefined', () => {
    expect(normalizeReason(undefined)).toBeUndefined()
  })

  test('texte blanc devient undefined', () => {
    expect(normalizeReason('   ')).toBeUndefined()
  })

  test('trim', () => {
    expect(normalizeReason('  Retard  ')).toBe('Retard')
  })

  test('tronque à la longueur maximale', () => {
    expect(normalizeReason('x'.repeat(250))).toBe('x'.repeat(MAX_REASON_LENGTH))
  })

  test('trim avant troncature', () => {
    expect(normalizeReason('  ' + 'x'.repeat(210))).toBe('x'.repeat(200))
  })
})
