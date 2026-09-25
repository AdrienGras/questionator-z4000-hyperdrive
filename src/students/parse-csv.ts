import Papa from 'papaparse'
import { classifyHeaderCell } from './header'
import { csvError, csvWarning, type CsvIssue } from './issues'

export type CsvStudent = { lastName: string; firstName: string; line: number }
export type CsvParseResult = { students: CsvStudent[]; issues: CsvIssue[] }

/** Nombre de lignes non vides examinées pour trouver l'en-tête (D55). */
const HEADER_SEARCH_LINES = 5
const BOM = '﻿'

type Row = { line: number; cells: string[] }
type Columns = { lastName: number; firstName: number }

function findHeader(rows: readonly Row[]): { index: number; columns: Columns } | undefined {
  for (const [index, row] of rows.slice(0, HEADER_SEARCH_LINES).entries()) {
    const lastName = row.cells.findIndex((cell) => classifyHeaderCell(cell) === 'lastName')
    const firstName = row.cells.findIndex((cell) => classifyHeaderCell(cell) === 'firstName')
    if (lastName !== -1 && firstName !== -1) return { index, columns: { lastName, firstName } }
  }
  return undefined
}

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Clé de doublon : trim, sans diacritiques, sans casse. */
function identityKey(lastName: string, firstName: string): string {
  return `${fold(lastName)}\u0000${fold(firstName)}`
}

function nonEmptyCellCount(cells: readonly string[]): number {
  return cells.filter((cell) => cell.trim() !== '').length
}

/** Nombre de lignes (parmi un extrait) qu'un délimiteur candidat segmente en au moins 2 cellules non vides. */
function scoreDelimiter(source: string, delimiter: ',' | ';'): number {
  const preview = Papa.parse<string[]>(source, {
    header: false,
    skipEmptyLines: false,
    delimiter,
    preview: 50,
  })
  return preview.data.filter((cells) => nonEmptyCellCount(cells) >= 2).length
}

/**
 * Détecte le séparateur (`,` ou `;`) en comparant, guillemets respectés, le nombre de lignes que
 * chaque candidat segmente en au moins deux cellules non vides ; le plus consistant gagne. Égalité
 * (aucun signal, p. ex. fichier à une seule colonne) : `;`, le séparateur des exports Excel FR.
 *
 * PapaParse propose `delimitersToGuess`, mais son algorithme interne (comparaison de la régularité
 * du nombre de champs par ligne, sans tenir compte du sens des colonnes) échoue dès que
 * l'échantillon contient des lignes courtes ou vides : ligne vide finale (export Excel), lignes de
 * préambule à un seul mot, ligne à un seul champ au milieu du fichier. Un simple comptage de
 * caractères bruts échoue à son tour dès qu'une colonne contient des virgules ou points-virgules
 * non significatifs (préambule, adresse). Faire segmenter chaque candidat par PapaParse lui-même
 * (guillemets respectés) et compter les lignes correctement découpées est robuste aux deux.
 */
function detectDelimiter(source: string): ',' | ';' {
  const semicolonScore = scoreDelimiter(source, ';')
  const commaScore = scoreDelimiter(source, ',')
  return commaScore > semicolonScore ? ',' : ';'
}

/** Lit les lignes de données : construit les étudiants et signale doublons / lignes incomplètes / colonnes en trop. */
function readDataRows(
  dataRows: readonly Row[],
  columns: Columns,
): { students: CsvStudent[]; issues: CsvIssue[]; extraRows: number } {
  const students: CsvStudent[] = []
  const issues: CsvIssue[] = []
  const seen = new Map<string, number>()
  let extraRows = 0
  for (const { line, cells } of dataRows) {
    const lastName = cells[columns.lastName] ?? ''
    const firstName = cells[columns.firstName] ?? ''
    const hasExtra = cells.some(
      (cell, index) => cell !== '' && index !== columns.lastName && index !== columns.firstName,
    )
    if (hasExtra) extraRows += 1
    if (lastName === '' || firstName === '') {
      issues.push(csvWarning('single_field_row', {}, line))
      continue
    }
    const key = identityKey(lastName, firstName)
    const firstLine = seen.get(key)
    if (firstLine === undefined) seen.set(key, line)
    else
      issues.push(
        csvWarning('duplicate_student', { firstLine, name: `${lastName} ${firstName}` }, line),
      )
    students.push({ lastName, firstName, line })
  }
  return { students, issues, extraRows }
}

/**
 * Lit une liste d'étudiants (§6.1, D25, D55). Pure. Aucune ligne isolée ne bloque : seules une
 * erreur de syntaxe (guillemet non fermé) ou l'absence d'étudiant valide sont des erreurs.
 */
export function parseStudentsCsv(text: string): CsvParseResult {
  const source = text.startsWith(BOM) ? text.slice(BOM.length) : text
  const parsed = Papa.parse<string[]>(source, {
    header: false,
    skipEmptyLines: false,
    delimiter: detectDelimiter(source),
  })
  const quoteError = parsed.errors.find((error) => error.type === 'Quotes')
  if (quoteError) {
    return { students: [], issues: [csvError('csv_syntax', {}, (quoteError.row ?? 0) + 1)] }
  }

  // Numéros de ligne : `parsed.data[i]` correspond à la ligne `i + 1` du fichier tant qu'aucune
  // cellule entre guillemets ne contient de saut de ligne (cas marginal, non géré).
  const rows: Row[] = parsed.data
    .map((cells, index) => ({ line: index + 1, cells: cells.map((cell) => cell.trim()) }))
    .filter((row) => row.cells.some((cell) => cell !== ''))

  const issues: CsvIssue[] = []
  const header = findHeader(rows)
  if (header && header.index > 0)
    issues.push(csvWarning('preamble_skipped', { count: header.index }))
  const columns: Columns = header?.columns ?? { lastName: 0, firstName: 1 }
  const dataRows = header ? rows.slice(header.index + 1) : rows

  const { students, issues: rowIssues, extraRows } = readDataRows(dataRows, columns)
  issues.push(...rowIssues)
  if (extraRows > 0) issues.push(csvWarning('extra_columns', { count: extraRows }))
  if (students.length === 0) issues.push(csvError('no_students', {}))
  return { students, issues }
}
