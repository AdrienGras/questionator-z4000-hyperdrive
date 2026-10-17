import type { DbStatus } from '@/lib/db/db'
import type { CreateForm } from '@/features/create-session/hooks/use-create-form'

/** Cause qui empêche de créer la session, expliquée sous le bouton désactivé (D103). */
export type SubmitBlocker = 'db' | 'students' | 'config' | 'files' | 'name'

/**
 * Première cause qui bloque la création, dans l'ordre : base, CSV, config, fichier manquant, nom.
 * `undefined` si rien ne bloque, ou pendant une lecture ou l'écriture : un état transitoire
 * n'est jamais expliqué.
 */
export function submitBlocker(
  form: Pick<CreateForm, 'students' | 'config' | 'name' | 'submitting'>,
  dbStatus: DbStatus,
): SubmitBlocker | undefined {
  const { students, config } = form
  if (form.submitting || students.kind === 'reading' || config.kind === 'reading') return undefined
  if (dbStatus !== 'open') return 'db'
  if (
    students.kind === 'read-error' ||
    (students.kind === 'loaded' && students.result.issues.some((i) => i.severity === 'error'))
  ) {
    return 'students'
  }
  if (
    config.kind === 'read-error' ||
    config.kind === 'load-error' ||
    (config.kind === 'loaded' && !config.result.ok)
  ) {
    return 'config'
  }
  if (students.kind === 'empty' || config.kind === 'empty') return 'files'
  if (form.name.trim() === '') return 'name'
  return undefined
}
