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

function splitFencedCode(prompt: string): { prose: string[]; code: string[] } {
  const prose: string[] = []
  const code: string[] = []
  let inFence = false
  for (const line of prompt.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      code.push(line)
    } else {
      prose.push(line)
    }
  }
  return { prose, code }
}

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
  const { prose, code } = splitFencedCode(prompt)
  const line =
    prose.map(stripInlineMarkdown).find((text) => text !== '') ??
    code.map(collapseSpaces).find((text) => text !== '') ??
    fallback
  return truncateOnWord(line, MAX_TITLE_LENGTH)
}
