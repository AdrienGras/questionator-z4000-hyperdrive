import { TABLER_ICONS_URL } from '@/domain/config/schema-values'
import type { AssistHover } from '@/features/config-editor/schema-assist'

/** Libellés traduits de la bulle de survol. */
export type HoverLabels = {
  default: string
  values: string
  iconSearch: string
  iconHint: string
}

/** Ligne « libellé : `a`, `b` », chaque valeur dans un `code`. */
function codeLine(label: string, values: readonly string[]): HTMLElement {
  const line = document.createElement('p')
  line.append(`${label} `)
  values.forEach((value, index) => {
    if (index > 0) line.append(', ')
    const code = document.createElement('code')
    code.textContent = value
    line.append(code)
  })
  return line
}

/**
 * Contenu de la bulle de survol : description, valeurs possibles (ou, pour une liste ouverte, lien
 * de recherche Tabler et rappel de l'autocomplétion), puis défaut. Texte posé via `textContent` et
 * `append`, jamais `innerHTML`.
 */
export function hoverDom(hover: AssistHover, labels: HoverLabels): HTMLElement {
  const dom = document.createElement('div')
  dom.className = 'cm-schema-hover'
  const description = document.createElement('p')
  description.textContent = hover.description
  dom.append(description)
  if (hover.values !== undefined) dom.append(codeLine(labels.values, hover.values))
  if (hover.openValues) {
    const line = document.createElement('p')
    const link = document.createElement('a')
    link.href = TABLER_ICONS_URL
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.textContent = labels.iconSearch
    line.append(link)
    const hint = document.createElement('p')
    hint.textContent = labels.iconHint
    dom.append(line, hint)
  }
  if ('default' in hover) dom.append(codeLine(labels.default, [JSON.stringify(hover.default)]))
  return dom
}
