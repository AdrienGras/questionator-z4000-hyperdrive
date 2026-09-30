import { normalizeLanguage } from '@/lib/markdown/languages'

// F18 (D63) : heuristique qui ne sert qu'à produire un avertissement ; le rendu repose sur l'arbre
// de react-markdown. Parcours à la main, ligne par ligne : aucune regex à risque super-linéaire.

const MAX_INDENT = 3
const MIN_MARKER = 3

interface Marker {
  readonly char: string
  readonly length: number
  readonly rest: string
}

/** Lit un marqueur de fence en début de ligne (0 à 3 espaces, puis au moins 3 ` ou ~). */
function readMarker(line: string): Marker | null {
  let start = 0
  while (start < line.length && line[start] === ' ') start += 1
  if (start > MAX_INDENT) return null
  const char = line[start]
  if (char !== '`' && char !== '~') return null
  let end = start
  while (line[end] === char) end += 1
  const length = end - start
  if (length < MIN_MARKER) return null
  return { char, length, rest: line.slice(end) }
}

/** Langages normalisés des blocs clôturés, dans l'ordre, doublons compris. */
export function fenceLanguages(markdown: string): readonly string[] {
  const languages: string[] = []
  let open: Marker | null = null
  for (const line of markdown.split(/\r?\n/)) {
    const marker = readMarker(line)
    if (open) {
      const closes =
        marker !== null &&
        marker.char === open.char &&
        marker.length >= open.length &&
        marker.rest.trim() === ''
      if (closes) open = null
      continue
    }
    // Une info string de fence à backticks ne contient pas de backtick : sinon c'est du code inline.
    if (marker === null || (marker.char === '`' && marker.rest.includes('`'))) continue
    open = marker
    const language = normalizeLanguage(marker.rest)
    if (language !== '') languages.push(language)
  }
  return languages
}
