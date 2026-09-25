import { DEFAULT_LOCALE, isLocale, type Locale } from './index'

/** Première langue dont le sous-tag primaire est supportée (`fr-CA` → `fr`), sinon `fr` (D51). */
export function detectBrowserLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const primary = language.split('-')[0]?.toLowerCase()
    if (isLocale(primary)) return primary
  }
  return DEFAULT_LOCALE
}

export function readNavigatorLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  if (navigator.languages.length > 0) return navigator.languages
  return [navigator.language]
}
