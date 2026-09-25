import { formatPath } from '@/domain/config/issues'
import { formatConfigIssue } from '@/domain/config/messages'
import { t, type Dictionary, type Locale } from '@/lib/i18n/i18n'
import { isBackupRuleIssue, type BackupIssue, type BackupIssueParams } from './issues'

const fr: Dictionary<BackupIssueParams> = {
  unknown_format: () => "Ce fichier n'est pas un backup Questionator.",
  unsupported_format_version: ({ found, supported }) =>
    `Ce backup utilise le format ${found}, cette version de l'application ne lit que jusqu'au format ${supported} : il faut mettre à jour l'application.`,
  unknown_category: ({ categoryId }) =>
    `La catégorie « ${categoryId} » n'existe pas dans la config de la session.`,
  unknown_question: ({ categoryId, questionId }) =>
    `La question « ${questionId} » n'existe pas dans la catégorie « ${categoryId} ».`,
  score_not_in_scale: ({ score, scale }) =>
    `La note ${score} ne fait pas partie du barème (${scale}).`,
  score_mismatch: ({ outcome }) =>
    outcome === 'scored'
      ? 'Une question notée doit avoir une note.'
      : `Une question « ${outcome} » ne doit pas avoir de note.`,
  skip_reason_mismatch: () => 'Seule une question passée peut avoir un motif de skip.',
  multiple_pending: ({ count }) =>
    `${count} questions sont en attente pour cet étudiant ; une seule est possible.`,
  absent_with_attempts: () => 'Un étudiant absent ne peut pas avoir de question tirée.',
  duplicate_student_id: ({ id, firstPath }) =>
    `Identifiant d'étudiant « ${id} » en double (déjà utilisé en ${firstPath}).`,
  duplicate_attempt_id: ({ id, firstPath }) =>
    `Identifiant de question tirée « ${id} » en double (déjà utilisé en ${firstPath}).`,
  unknown_active_student: ({ studentId }) => `L'étudiant actif « ${studentId} » n'existe pas.`,
  unknown_projected_student: ({ studentId }) => `L'étudiant projeté « ${studentId} » n'existe pas.`,
  projection_mismatch: () =>
    'La projection est incohérente : un étudiant est requis en mode « student », et seulement dans ce mode.',
}

const en: Dictionary<BackupIssueParams> = {
  unknown_format: () => 'This file is not a Questionator backup.',
  unsupported_format_version: ({ found, supported }) =>
    `This backup uses format ${found}; this version of the app only reads up to format ${supported}: please update the app.`,
  unknown_category: ({ categoryId }) =>
    `Category "${categoryId}" does not exist in the session config.`,
  unknown_question: ({ categoryId, questionId }) =>
    `Question "${questionId}" does not exist in category "${categoryId}".`,
  score_not_in_scale: ({ score, scale }) => `Score ${score} is not part of the scale (${scale}).`,
  score_mismatch: ({ outcome }) =>
    outcome === 'scored'
      ? 'A scored question must have a score.'
      : `A "${outcome}" question must not have a score.`,
  skip_reason_mismatch: () => 'Only a skipped question can have a skip reason.',
  multiple_pending: ({ count }) =>
    `${count} questions are pending for this student; only one is allowed.`,
  absent_with_attempts: () => 'An absent student cannot have drawn questions.',
  duplicate_student_id: ({ id, firstPath }) =>
    `Duplicate student id "${id}" (already used at ${firstPath}).`,
  duplicate_attempt_id: ({ id, firstPath }) =>
    `Duplicate drawn-question id "${id}" (already used at ${firstPath}).`,
  unknown_active_student: ({ studentId }) => `Active student "${studentId}" does not exist.`,
  unknown_projected_student: ({ studentId }) => `Projected student "${studentId}" does not exist.`,
  projection_mismatch: () =>
    'The projection is inconsistent: a student is required in "student" mode, and only in that mode.',
}

export const BACKUP_ISSUE_MESSAGES: Record<Locale, Dictionary<BackupIssueParams>> = { fr, en }

/** Message seul ; le chemin s'affiche à part avec `formatIssuePath`. */
export function formatBackupIssue(issue: BackupIssue, locale: Locale): string {
  if (isBackupRuleIssue(issue)) return t(BACKUP_ISSUE_MESSAGES, locale, issue.code, issue.params)
  return formatConfigIssue(issue, locale)
}

export function formatIssuePath(issue: BackupIssue): string {
  return formatPath(issue.path)
}
