import { describe, expect, test } from 'vitest'
import { compareRecords } from './record-order'

const rec = (id: string, updatedAt?: unknown) => ({ id, updatedAt })

describe('compareRecords', () => {
  test('ordre normal : updatedAt décroissant', () => {
    expect(compareRecords(rec('a', '2026-01-02'), rec('b', '2026-01-01'))).toBeLessThan(0)
    expect(compareRecords(rec('a', '2026-01-01'), rec('b', '2026-01-02'))).toBeGreaterThan(0)
  })

  test('updatedAt égaux : id décroissant, dans les deux ordres', () => {
    expect(compareRecords(rec('b', 'x'), rec('a', 'x'))).toBeLessThan(0)
    expect(compareRecords(rec('a', 'x'), rec('b', 'x'))).toBeGreaterThan(0)
  })

  test('un seul sans updatedAt : il passe en fin, des deux côtés', () => {
    expect(compareRecords(rec('a'), rec('b', 'x'))).toBeGreaterThan(0)
    expect(compareRecords(rec('a', 'x'), rec('b'))).toBeLessThan(0)
  })

  test('updatedAt non textuel : traité comme absent', () => {
    expect(compareRecords(rec('a', 42), rec('b', 'x'))).toBeGreaterThan(0)
  })

  test('les deux sans updatedAt : id croissant, dans les deux ordres', () => {
    expect(compareRecords(rec('a'), rec('b'))).toBeLessThan(0)
    expect(compareRecords(rec('b'), rec('a'))).toBeGreaterThan(0)
  })
})
