import { t, type Dictionary, type Locale } from '../i18n'
import type { CsvIssue, CsvIssueParams } from './issues'

const plural = (count: number, suffix: string) => (count > 1 ? suffix : '')

const fr: Dictionary<CsvIssueParams> = {
  csv_syntax: () => 'Guillemet non fermé : la suite du fichier ne peut pas être lue.',
  no_students: () =>
    'Aucun étudiant valide dans ce fichier (il faut un nom et un prénom par ligne).',
  preamble_skipped: ({ count }) =>
    `${count} ligne${plural(count, 's')} avant l'en-tête ignorée${plural(count, 's')}.`,
  single_field_row: () => 'Nom ou prénom manquant : ligne ignorée.',
  extra_columns: ({ count }) =>
    `Colonnes en trop sur ${count} ligne${plural(count, 's')} : seules les colonnes nom et prénom sont lues.`,
  duplicate_student: ({ firstLine, name }) => `${name} figure déjà ligne ${firstLine}.`,
}

const en: Dictionary<CsvIssueParams> = {
  csv_syntax: () => 'Unclosed quote: the rest of the file cannot be read.',
  no_students: () =>
    'No valid student in this file (each line needs a last name and a first name).',
  preamble_skipped: ({ count }) => `${count} line${plural(count, 's')} before the header ignored.`,
  single_field_row: () => 'Missing last name or first name: line ignored.',
  extra_columns: ({ count }) =>
    `Extra columns on ${count} line${plural(count, 's')}: only the last name and first name columns are read.`,
  duplicate_student: ({ firstLine, name }) => `${name} already appears on line ${firstLine}.`,
}

export const CSV_ISSUE_MESSAGES: Record<Locale, Dictionary<CsvIssueParams>> = { fr, en }

/** Message seul ; l'UI préfixe « Ligne N : » quand `issue.line` est défini. */
export function formatCsvIssue(issue: CsvIssue, locale: Locale): string {
  return t(CSV_ISSUE_MESSAGES, locale, issue.code, issue.params)
}
