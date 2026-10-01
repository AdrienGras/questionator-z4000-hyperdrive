import { fromZodIssues } from '@/domain/config/from-zod'
import type { ConfigIssue } from '@/domain/config/issues'
import type { CssSupports } from '@/domain/config/rules'
import { validateConfig } from '@/domain/config/validate'
import { SessionSchema } from '@/domain/session/schema'
import type { Session } from '@/domain/session/types'
import type { BackupIssue } from './issues'
import { checkSessionRules } from './rules'

export type StoredSessionResult =
  { ok: true; session: Session } | { ok: false; issues: BackupIssue[] }

function prefixed(issue: ConfigIssue, prefix: ConfigIssue['path']): ConfigIssue {
  return { ...issue, path: [...prefix, ...issue.path] }
}

/**
 * Valide une session sortie du stockage ou d'un backup : schéma → config figée (F02) → règles
 * croisées. Pure, ne lève jamais. Les chemins d'issues commencent par `session`. La config
 * renvoyée est celle du validateur.
 */
export function checkStoredSession(
  raw: unknown,
  deps: { cssSupports: CssSupports },
): StoredSessionResult {
  const parsed = SessionSchema.safeParse(raw)
  if (!parsed.success) {
    const issues = fromZodIssues(parsed.error.issues, raw).map((issue) =>
      prefixed(issue, ['session']),
    )
    return { ok: false, issues }
  }

  const { data: session } = parsed
  const validated = validateConfig(JSON.stringify(session.config), deps)
  if (!validated.ok) {
    const errors = validated.issues.filter((issue) => issue.severity === 'error')
    return { ok: false, issues: errors.map((issue) => prefixed(issue, ['session', 'config'])) }
  }

  const candidate: Session = { ...session, config: validated.config }
  const ruleIssues = checkSessionRules(candidate)
  if (ruleIssues.length > 0) return { ok: false, issues: ruleIssues }
  return { ok: true, session: candidate }
}
