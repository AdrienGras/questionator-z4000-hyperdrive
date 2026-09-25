import { z } from 'zod'
import { fromZodIssues } from '../config/from-zod'
import type { ConfigIssue } from '../config/issues'
import { parseJson } from '../config/parse-json'
import type { CssSupports } from '../config/rules'
import { validateConfig } from '../config/validate'
import { SessionSchema } from '../domain/schema'
import type { Session } from '../domain/types'
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION } from './envelope'
import { backupError, type BackupIssue } from './issues'
import { checkSessionRules } from './rules'

export type BackupParseResult =
  { ok: true; session: Session } | { ok: false; issues: BackupIssue[] }

const BackupEnvelopeSchema = z.strictObject({
  format: z.literal(BACKUP_FORMAT),
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  appVersion: z.string().min(1),
  exportedAt: z.iso.datetime(),
  session: SessionSchema,
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Pas un backup, ou version future : issue unique, le reste serait du bruit (comme D39). */
function checkFormat(value: unknown): BackupIssue | undefined {
  if (!isRecord(value) || value.format !== BACKUP_FORMAT)
    return backupError('unknown_format', [], {})
  const found = value.formatVersion
  if (typeof found === 'number' && Number.isInteger(found) && found > BACKUP_FORMAT_VERSION) {
    return backupError('unsupported_format_version', ['formatVersion'], {
      found,
      supported: BACKUP_FORMAT_VERSION,
    })
  }
  return undefined
}

function prefixConfigPath(issue: ConfigIssue): ConfigIssue {
  return { ...issue, path: ['session', 'config', ...issue.path] }
}

/**
 * Valide un fichier de backup (D24, D48, D49) : JSON → format → enveloppe et session → config
 * figée (F02) → règles croisées. Pure : n'écrit rien. La config renvoyée est celle du validateur.
 */
export function parseBackup(text: string, deps: { cssSupports: CssSupports }): BackupParseResult {
  const parsed = parseJson(text)
  if (!parsed.ok) return { ok: false, issues: [parsed.issue] }

  const formatIssue = checkFormat(parsed.value)
  if (formatIssue) return { ok: false, issues: [formatIssue] }

  const envelope = BackupEnvelopeSchema.safeParse(parsed.value)
  if (!envelope.success)
    return { ok: false, issues: fromZodIssues(envelope.error.issues, parsed.value) }

  const { session } = envelope.data
  const validated = validateConfig(JSON.stringify(session.config), deps)
  if (!validated.ok) {
    const errors = validated.issues.filter((issue) => issue.severity === 'error')
    return { ok: false, issues: errors.map((issue) => prefixConfigPath(issue)) }
  }

  const candidate: Session = { ...session, config: validated.config }
  const ruleIssues = checkSessionRules(candidate)
  if (ruleIssues.length > 0) return { ok: false, issues: ruleIssues }
  return { ok: true, session: candidate }
}
