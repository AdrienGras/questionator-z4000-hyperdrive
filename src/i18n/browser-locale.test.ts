import { describe, expect, test } from 'vitest'
import { detectBrowserLocale } from './browser-locale'

describe('detectBrowserLocale', () => {
  test.each([
    [['fr-FR', 'en'], 'fr'],
    [['en-US', 'fr'], 'en'],
    [['de-DE', 'en-GB'], 'en'],
    [['fr-CA'], 'fr'],
    [['EN'], 'en'],
    [['de', 'es'], 'fr'],
    [[], 'fr'],
  ])('%j → %s', (languages, expected) => {
    expect(detectBrowserLocale(languages)).toBe(expected)
  })
})
