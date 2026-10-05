import { fromZodIssues } from '@/domain/config/from-zod'
import type { ConfigIssue } from '@/domain/config/issues'
import type { CssSupports } from '@/domain/config/rules'
import { validateConfig } from '@/domain/config/validate'
import { TrainingDrawSchema, TrainingSchema } from './schema'
import type { Training, TrainingDraw } from './types'

export type StoredTrainingResult =
  | { ok: true; training: Training }
  | { ok: false; issues: ConfigIssue[] }

function prefixed(issue: ConfigIssue, prefix: ConfigIssue['path']): ConfigIssue {
  return { ...issue, path: [...prefix, ...issue.path] }
}

/**
 * Valide un entraînement sorti du stockage : schéma → config (F02, erreurs seules). Pure, ne lève
 * jamais. Les chemins commencent par `training` (ou `training.config`).
 */
export function checkStoredTraining(
  raw: unknown,
  deps: { cssSupports: CssSupports },
): StoredTrainingResult {
  const parsed = TrainingSchema.safeParse(raw)
  if (!parsed.success) {
    const issues = fromZodIssues(parsed.error.issues, raw).map((issue) =>
      prefixed(issue, ['training']),
    )
    return { ok: false, issues }
  }

  const { data } = parsed
  const validated = validateConfig(JSON.stringify(data.config), deps)
  if (!validated.ok) {
    const errors = validated.issues.filter((issue) => issue.severity === 'error')
    return { ok: false, issues: errors.map((issue) => prefixed(issue, ['training', 'config'])) }
  }
  return { ok: true, training: { ...data, config: validated.config } }
}

/** Lignes de journal valides, dans l'ordre ; les lignes invalides sont écartées. Ne lève jamais. */
export function parseStoredDraws(raw: readonly unknown[]): TrainingDraw[] {
  return raw.flatMap((row) => {
    const parsed = TrainingDrawSchema.safeParse(row)
    return parsed.success ? [parsed.data] : []
  })
}
