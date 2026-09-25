export const MAX_TITLE_LENGTH = 60

const FENCE = /^\s*(```|~~~)/
const HEADING_MARKER = /^#{1,6}\s+/
const QUOTE_MARKER = /^>\s?/
const BULLET_MARKER = /^[-*+]\s+/
const ORDERED_MARKER = /^\d+[.)]\s+/
const BLOCK_MARKER_PATTERNS = [HEADING_MARKER, QUOTE_MARKER, BULLET_MARKER, ORDERED_MARKER]
const CODE_SPAN = /(`[^`]*`)/
// Le contenu exclut son propre délimiteur (`[^*]`, `[^_]`, `[^~]`) : le prochain délimiteur
// rencontré termine forcément le match, sans retour arrière possible (pas de backtracking en
// O(n²) comme avec `.+?`, cf. typescript:S8786).
const STAR_EMPHASIS = /(\*{1,3})(?=\S)([^*]+?)(?<=\S)\1/g
const UNDERSCORE_EMPHASIS = /(?<![\p{L}\p{N}_])(_{1,3})(?=\S)([^_]+?)(?<=\S)\1(?![\p{L}\p{N}_])/gu
const STRIKETHROUGH = /~~(?=\S)([^~]+?)(?<=\S)~~/g
const LEFTOVER_MARKERS = /^[*_~\-\s]+$/
/** Borne chaque ligne avant les regex : un titre n'en garde que 60 caractères (F7). */
const MAX_LINE_LENGTH = 500

/**
 * Retire les marqueurs de bloc en tête de ligne (titres `#`, citations `>`, listes `- * +`
 * et `1.`/`1)`), répétés (ex. `> - item`). Remplace l'ancienne regex unique à quantificateur
 * imbriqué (26 de complexité, typescript:S5843) par une boucle de regexes simples.
 */
function stripBlockMarkers(line: string): string {
  let text = line.replace(/^\s{0,3}/, '')
  let changed = true
  while (changed) {
    changed = false
    for (const marker of BLOCK_MARKER_PATTERNS) {
      const next = text.replace(marker, '')
      if (next !== text) {
        text = next
        changed = true
      }
    }
  }
  return text
}

/**
 * Remplace `![alt](url)` et `[texte](url)` par `alt`/`texte`, sans toucher aux crochets non
 * appariés. Scanner linéaire en O(n) : la regex équivalente (`/\[([^\]]*)\]\([^)]*\)/g`)
 * retente un match à chaque position, ce qui dégénère en O(n²) sur une ligne pleine de `[`
 * non fermés (typescript:S8786).
 */
export function stripLinksAndImages(text: string): string {
  let result = ''
  let i = 0
  while (i < text.length) {
    const isImage = text[i] === '!' && text[i + 1] === '['
    const bracketStart = isImage ? i + 1 : i
    if (text[bracketStart] === '[') {
      const closeBracket = text.indexOf(']', bracketStart + 1)
      const hasParenOpen = closeBracket !== -1 && text[closeBracket + 1] === '('
      const closeParen = hasParenOpen ? text.indexOf(')', closeBracket + 2) : -1
      if (closeParen !== -1) {
        result += text.slice(bracketStart + 1, closeBracket)
        i = closeParen + 1
        continue
      }
    }
    result += text[i]
    i += 1
  }
  return result
}

function stripEmphasis(text: string): string {
  return stripLinksAndImages(text)
    .replace(STAR_EMPHASIS, '$2')
    .replace(UNDERSCORE_EMPHASIS, '$2')
    .replace(STRIKETHROUGH, '$1')
}

function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function stripInlineMarkdown(line: string): string {
  const text = stripBlockMarkers(line)
    .split(CODE_SPAN)
    .map((part) =>
      part.length >= 2 && part.startsWith('`') && part.endsWith('`')
        ? part.slice(1, -1)
        : stripEmphasis(part),
    )
    .join('')
  const collapsed = collapseSpaces(text)
  return LEFTOVER_MARKERS.test(collapsed) ? '' : collapsed
}

function truncateOnWord(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const boundary = text[max - 1] === ' ' ? cut.length : cut.lastIndexOf(' ')
  const base = boundary > 0 ? cut.slice(0, boundary) : cut
  return `${base.trimEnd()}…`
}

/** Titre court dérivé du `prompt` (D41) : première ligne de texte, markdown retiré, 60 caractères. */
export function deriveTitle(prompt: string, fallback: string): string {
  let inFence = false
  let firstCode: string | undefined
  for (const rawLine of prompt.split(/\r?\n/)) {
    const line = rawLine.slice(0, MAX_LINE_LENGTH)
    if (FENCE.test(line)) {
      inFence = !inFence
    } else if (inFence) {
      const text = collapseSpaces(line)
      if (text !== '') firstCode ??= text
    } else {
      const text = stripInlineMarkdown(line)
      if (text !== '') return truncateOnWord(text, MAX_TITLE_LENGTH)
    }
  }
  return truncateOnWord(firstCode ?? fallback, MAX_TITLE_LENGTH)
}
