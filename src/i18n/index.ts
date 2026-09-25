export const SUPPORTED_LOCALES = ['fr', 'en'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'fr'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/** Un dictionnaire associe à chaque clé une fonction de formatage aux paramètres typés. */
export type Dictionary<P extends object> = { [K in keyof P]: (params: P[K]) => string }

export function t<P extends object, K extends keyof P>(
  dictionaries: Record<Locale, Dictionary<P>>,
  locale: Locale,
  key: K,
  params: P[K],
): string {
  return dictionaries[locale][key](params)
}
