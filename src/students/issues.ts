type NoParams = Record<string, never>

/** Paramètres par code (D18) ; le numéro de ligne est porté par `CsvIssue.line`. */
export type CsvIssueParams = {
  csv_syntax: NoParams
  no_students: NoParams
  preamble_skipped: { count: number }
  single_field_row: NoParams
  extra_columns: { count: number }
  duplicate_student: { firstLine: number; name: string }
}

export type CsvIssueCode = keyof CsvIssueParams

export type CsvIssue = {
  [C in CsvIssueCode]: {
    severity: 'error' | 'warning'
    code: C
    line?: number
    params: CsvIssueParams[C]
  }
}[CsvIssueCode]

function createIssue<C extends CsvIssueCode>(
  severity: 'error' | 'warning',
  code: C,
  params: CsvIssueParams[C],
  line?: number,
): CsvIssue {
  const issue = { severity, code, ...(line === undefined ? {} : { line }), params }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- union discriminée distributive construite depuis un C générique, comme createIssue (config/issues.ts).
  return issue as CsvIssue
}

export function csvError<C extends CsvIssueCode>(
  code: C,
  params: CsvIssueParams[C],
  line?: number,
): CsvIssue {
  return createIssue('error', code, params, line)
}

export function csvWarning<C extends CsvIssueCode>(
  code: C,
  params: CsvIssueParams[C],
  line?: number,
): CsvIssue {
  return createIssue('warning', code, params, line)
}
