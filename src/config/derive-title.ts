export const MAX_TITLE_LENGTH = 60

const FENCE = /^\s*(```|~~~)/
const BLOCK_MARKERS = /^\s{0,3}(?:#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)*/
const CODE_SPAN = /(`[^`]*`)/
const IMAGE = /!\[([^\]]*)\]\([^)]*\)/g
const LINK = /\[([^\]]*)\]\([^)]*\)/g
const STAR_EMPHASIS = /(\*{1,3})(?=\S)(.+?)(?<=\S)\1/g
const UNDERSCORE_EMPHASIS = /(?<![\p{L}\p{N}_])(_{1,3})(?=\S)(.+?)(?<=\S)\1(?![\p{L}\p{N}_])/gu
const STRIKETHROUGH = /~~(?=\S)(.+?)(?<=\S)~~/g
const LEFTOVER_MARKERS = /^[*_~\-\s]+$/
/** Borne chaque ligne avant les regex : un titre n'en garde que 60 caractères (F7). */
const MAX_LINE_LENGTH = 500

function stripEmphasis(text: string): string {
  return text
    .replace(IMAGE, '$1')
    .replace(LINK, '$1')
    .replace(STAR_EMPHASIS, '$2')
    .replace(UNDERSCORE_EMPHASIS, '$2')
    .replace(STRIKETHROUGH, '$1')
}

function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function stripInlineMarkdown(line: string): string {
  const text = line
    .replace(BLOCK_MARKERS, '')
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
