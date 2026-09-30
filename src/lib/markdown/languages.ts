// F18 (D63) : vocabulaire des langages de blocs de code, sans aucun import de Shiki.
// Vit dans lib/ pour que CodeBlock puisse l'utiliser sans tirer le catalogue de grammaires.

/** Pseudo-langages : texte brut, jamais de chargement ni d'avertissement. */
export const PLAIN_LANGUAGES: ReadonlySet<string> = new Set(['text', 'txt', 'plain', 'plaintext'])

/** Premier mot de l'info string d'un bloc, en minuscules (`PHP title=x` donne `php`). */
export function normalizeLanguage(info: string): string {
  const [first = ''] = info.trim().split(/\s+/, 1)
  return first.toLowerCase()
}

/** Vrai pour un pseudo-langage ; attend une valeur déjà normalisée. */
export function isPlainLanguage(language: string): boolean {
  return PLAIN_LANGUAGES.has(language)
}
