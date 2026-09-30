import { describe, expect, test } from 'vitest'
import { localDateStamp, slugify } from './file-name'

describe('slugify', () => {
  test.each([
    ['Oral PHP — Jury 2', 'oral-php-jury-2'],
    ['Élève  Ça   Marche !', 'eleve-ca-marche'],
    ['—', 'session'],
    ['', 'session'],
    ['🎓🎓', 'session'],
    ['a'.repeat(80), 'a'.repeat(60)],
    [`${'a'.repeat(59)} b`, 'a'.repeat(59)],
  ])('%s → %s', (name, slug) => {
    expect(slugify(name)).toBe(slug)
  })
})

describe('localDateStamp', () => {
  test('date murale locale, pas UTC', () => {
    expect(localDateStamp(new Date(2026, 8, 25, 23, 30))).toBe('2026-09-25')
    expect(localDateStamp(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05')
  })
})
