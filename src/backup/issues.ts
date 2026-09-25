import type { ConfigIssue, IssuePath } from '../config/issues'

type NoParams = Record<string, never>

/** Codes propres au backup ; aucun ne recoupe un code de config (D18, D48). */
export type BackupIssueParams = {
  unknown_format: NoParams
  unsupported_format_version: { found: number; supported: number }
  unknown_category: { categoryId: string }
  unknown_question: { categoryId: string; questionId: string }
  score_not_in_scale: { score: number; scale: string }
  score_mismatch: { outcome: string }
  skip_reason_mismatch: NoParams
  multiple_pending: { count: number }
  absent_with_attempts: NoParams
  duplicate_student_id: { id: string; firstPath: string }
  duplicate_attempt_id: { id: string; firstPath: string }
  unknown_active_student: { studentId: string }
  unknown_projected_student: { studentId: string }
  projection_mismatch: NoParams
}

export type BackupIssueCode = keyof BackupIssueParams

export type BackupRuleIssue = {
  [C in BackupIssueCode]: {
    severity: 'error'
    code: C
    path: IssuePath
    params: BackupIssueParams[C]
  }
}[BackupIssueCode]

export type BackupIssue = ConfigIssue | BackupRuleIssue

/** Objet exhaustif : le compilateur signale tout code de `BackupIssueParams` oublié ici. */
const BACKUP_CODE_MAP: Record<BackupIssueCode, true> = {
  unknown_format: true,
  unsupported_format_version: true,
  unknown_category: true,
  unknown_question: true,
  score_not_in_scale: true,
  score_mismatch: true,
  skip_reason_mismatch: true,
  multiple_pending: true,
  absent_with_attempts: true,
  duplicate_student_id: true,
  duplicate_attempt_id: true,
  unknown_active_student: true,
  unknown_projected_student: true,
  projection_mismatch: true,
}

const BACKUP_CODES: ReadonlySet<string> = new Set(Object.keys(BACKUP_CODE_MAP))

export function isBackupRuleIssue(issue: BackupIssue): issue is BackupRuleIssue {
  return BACKUP_CODES.has(issue.code)
}

export function backupError<C extends BackupIssueCode>(
  code: C,
  path: IssuePath,
  params: BackupIssueParams[C],
): BackupRuleIssue {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- union discriminée distributive construite depuis un C générique, comme createIssue (config/issues.ts).
  return { severity: 'error', code, path, params } as BackupRuleIssue
}
