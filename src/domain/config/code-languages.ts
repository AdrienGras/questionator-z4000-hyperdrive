import { bundledLanguages } from 'shiki/langs'
import { normalizeLanguage } from '@/lib/markdown/languages'

// F18 (D63) : l'import statique de `shiki/langs` n'amène que des `import()` de grammaires
// (une table identifiant/alias vers des chargeurs paresseux) ; aucune grammaire n'est évaluée ici.

/** Vrai si le langage est un identifiant ou un alias du catalogue Shiki. */
export function isKnownLanguage(language: string): boolean {
  return Object.hasOwn(bundledLanguages, normalizeLanguage(language))
}
