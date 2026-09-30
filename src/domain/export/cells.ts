import type { Cell } from './types'

/** Cellule texte, écrite telle quelle (un « =1+1 » reste du texte). */
export function text(value: string, bold = false): Cell {
  return bold ? { kind: 'text', value, bold: true } : { kind: 'text', value }
}

/** Cellule texte, ou vide si la valeur est absente ou vide. */
export function optionalText(value: string | undefined): Cell {
  return value === undefined || value === '' ? null : text(value)
}

/** Cellule nombre ; sans `format`, le format général du tableur s'applique. */
export function num(value: number, format?: string): Cell {
  return format === undefined ? { kind: 'number', value } : { kind: 'number', value, format }
}

/** Cellule date, au format donné (voir `dateFormat`). */
export function date(value: Date, format: string): Cell {
  return { kind: 'date', value, format }
}

/** Ligne d'en-têtes : un texte en gras par libellé. */
export function header(labels: string[]): Cell[] {
  return labels.map((label) => text(label, true))
}
