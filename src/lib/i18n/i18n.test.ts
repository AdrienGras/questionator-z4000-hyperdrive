import { describe, expect, test } from 'vitest'
import {
  DEFAULT_LOCALE,
  isLocale,
  SUPPORTED_LOCALES,
  t,
  type Dictionary,
  type Locale,
} from './i18n'

type Params = { hello: { name: string }; bye: Record<string, never> }

const dictionaries: Record<Locale, Dictionary<Params>> = {
  fr: { hello: ({ name }) => `Bonjour ${name}`, bye: () => 'Au revoir' },
  en: { hello: ({ name }) => `Hello ${name}`, bye: () => 'Goodbye' },
}

describe('i18n', () => {
  test('t formate la clé dans la langue demandée', () => {
    expect(t(dictionaries, 'fr', 'hello', { name: 'Ada' })).toBe('Bonjour Ada')
    expect(t(dictionaries, 'en', 'bye', {})).toBe('Goodbye')
  })

  test('isLocale ne reconnaît que les langues supportées', () => {
    expect(SUPPORTED_LOCALES).toEqual(['fr', 'en'])
    expect(DEFAULT_LOCALE).toBe('fr')
    expect(isLocale('en')).toBe(true)
    expect(isLocale('de')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})
