import { fromZodIssues } from './from-zod'
import { ICON_NAME_SET } from './icon-names'
import { configError, type ConfigIssue } from './issues'
import { normalize, type NormalizedConfig } from './normalize'
import { parseJson } from './parse-json'
import { checkRules, type RuleDeps } from './rules'
import { ConfigSchema, SCHEMA_VERSION } from './schema'

export type ValidationResult =
  | { ok: true; config: NormalizedConfig; issues: ConfigIssue[] }
  | { ok: false; issues: ConfigIssue[] }

/** Version future : seule issue renvoyée, les champs inconnus seraient du bruit (D39). */
function checkFutureVersion(value: unknown): ConfigIssue | undefined {
  if (typeof value !== 'object' || value === null || !('schemaVersion' in value)) return undefined
  const found = value.schemaVersion
  if (typeof found !== 'number' || !Number.isInteger(found) || found <= SCHEMA_VERSION) {
    return undefined
  }
  return configError('unsupported_schema_version', ['schemaVersion'], {
    found,
    supported: SCHEMA_VERSION,
  })
}

export type ValidateDeps = Omit<RuleDeps, 'iconNames'>

/**
 * Valide le texte d'un fichier de config. Ne produit aucun texte : les issues sont traduites
 * par `formatConfigIssue`. `cssSupports` est injecté (`CSS.supports` dans le navigateur, D15) ;
 * `isKnownLanguage` aussi, facultatif : sans lui, pas d'avertissement `unknown_code_language`.
 */
export function validateConfig(text: string, deps: ValidateDeps): ValidationResult {
  const parsed = parseJson(text)
  if (!parsed.ok) return { ok: false, issues: [parsed.issue] }

  const versionIssue = checkFutureVersion(parsed.value)
  if (versionIssue) return { ok: false, issues: [versionIssue] }

  const result = ConfigSchema.safeParse(parsed.value)
  if (!result.success) {
    return { ok: false, issues: fromZodIssues(result.error.issues, parsed.value) }
  }

  const issues = checkRules(result.data, { ...deps, iconNames: ICON_NAME_SET })
  if (issues.some((issue) => issue.severity === 'error')) return { ok: false, issues }
  return { ok: true, config: normalize(result.data), issues }
}
