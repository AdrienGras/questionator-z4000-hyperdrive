export type IssuePath = (string | number)[]

type NoParams = Record<string, never>

/** Paramètres de chaque code d'issue. Le validateur ne produit aucun texte (D18). */
export type ConfigIssueParams = {
  json_syntax: { line?: number; column?: number }
  unsupported_schema_version: { found: number; supported: number }
  required: NoParams
  invalid_type: { expected: string }
  unknown_key: { key: string }
  invalid_enum: { options: string }
  not_integer: NoParams
  too_small: { minimum: number; inclusive: boolean }
  too_big: { maximum: number; inclusive: boolean }
  empty_string: NoParams
  invalid_css_shape: NoParams
  invalid_value: NoParams
  duplicate_category_id: { id: string; firstPath: string }
  duplicate_question_id: { id: string; firstPath: string }
  empty_scale: NoParams
  negative_scale_value: { value: number }
  duplicate_scale_value: { value: number }
  zero_max_scale: NoParams
  category_without_questions: NoParams
  not_enough_questions: { total: number; required: number; skips: number }
  missing_absent_value: NoParams
  too_many_decimals: { value: number }
  invalid_css_value: { property: 'color' | 'border-radius'; value: string }
  unreachable_max_score: { reachable: number; maxRawScore: number }
  final_scale_off_grid: { finalScale: number; step: number }
  unknown_icon: { icon: string }
}

export type ConfigIssueCode = keyof ConfigIssueParams

export type ConfigIssueSeverity = 'error' | 'warning'

export type ConfigIssue = {
  [C in ConfigIssueCode]: {
    severity: ConfigIssueSeverity
    code: C
    path: IssuePath
    params: ConfigIssueParams[C]
  }
}[ConfigIssueCode]

function createIssue<C extends ConfigIssueCode>(
  severity: ConfigIssueSeverity,
  code: C,
  path: IssuePath,
  params: ConfigIssueParams[C],
): ConfigIssue {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- construction d'une union discriminée distributive à partir d'un C générique ; la forme est garantie par la signature de createIssue.
  return { severity, code, path, params } as ConfigIssue
}

export function configError<C extends ConfigIssueCode>(
  code: C,
  path: IssuePath,
  params: ConfigIssueParams[C],
): ConfigIssue {
  return createIssue('error', code, path, params)
}

export function configWarning<C extends ConfigIssueCode>(
  code: C,
  path: IssuePath,
  params: ConfigIssueParams[C],
): ConfigIssue {
  return createIssue('warning', code, path, params)
}

/** `['categories', 2, 'questions', 5, 'id']` → `categories[2].questions[5].id` */
export function formatPath(path: readonly (string | number)[]): string {
  return path.reduce<string>((formatted, segment) => {
    if (typeof segment === 'number') return `${formatted}[${segment}]`
    return formatted === '' ? segment : `${formatted}.${segment}`
  }, '')
}
