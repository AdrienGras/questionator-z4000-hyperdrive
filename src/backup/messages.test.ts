import { describe, expect, test } from 'vitest'
import { configError } from '../config/issues'
import { SUPPORTED_LOCALES } from '../i18n'
import type { BackupIssueParams } from './issues'
import { backupError } from './issues'
import { BACKUP_ISSUE_MESSAGES, formatBackupIssue } from './messages'

/** Un jeu de paramètres réels par code, pour vérifier que chaque texte est non vide. */
const SAMPLE_PARAMS: BackupIssueParams = {
  unknown_format: {},
  unsupported_format_version: { found: 2, supported: 1 },
  unknown_category: { categoryId: 'a' },
  unknown_question: { categoryId: 'a', questionId: 'a-1' },
  score_not_in_scale: { score: 1.5, scale: '0, 1, 2' },
  score_mismatch: { outcome: 'scored' },
  skip_reason_mismatch: {},
  multiple_pending: { count: 2 },
  absent_with_attempts: {},
  duplicate_student_id: { id: 'student-1', firstPath: 'session.students[0].id' },
  duplicate_attempt_id: { id: 'attempt-1', firstPath: 'session.students[0].attempts[0].id' },
  unknown_active_student: { studentId: 'ghost' },
  unknown_projected_student: { studentId: 'ghost' },
  projection_mismatch: {},
}

describe('messages de backup', () => {
  test.each(SUPPORTED_LOCALES)('chaque code a un texte en %s', (locale) => {
    const dictionary = BACKUP_ISSUE_MESSAGES[locale]
    // Accès par propriété littérale : le type de chaque appel est connu statiquement, pas de `as`.
    expect(dictionary.unknown_format(SAMPLE_PARAMS.unknown_format).length).toBeGreaterThan(0)
    expect(
      dictionary.unsupported_format_version(SAMPLE_PARAMS.unsupported_format_version).length,
    ).toBeGreaterThan(0)
    expect(dictionary.unknown_category(SAMPLE_PARAMS.unknown_category).length).toBeGreaterThan(0)
    expect(dictionary.unknown_question(SAMPLE_PARAMS.unknown_question).length).toBeGreaterThan(0)
    expect(dictionary.score_not_in_scale(SAMPLE_PARAMS.score_not_in_scale).length).toBeGreaterThan(
      0,
    )
    expect(dictionary.score_mismatch(SAMPLE_PARAMS.score_mismatch).length).toBeGreaterThan(0)
    expect(
      dictionary.skip_reason_mismatch(SAMPLE_PARAMS.skip_reason_mismatch).length,
    ).toBeGreaterThan(0)
    expect(dictionary.multiple_pending(SAMPLE_PARAMS.multiple_pending).length).toBeGreaterThan(0)
    expect(
      dictionary.absent_with_attempts(SAMPLE_PARAMS.absent_with_attempts).length,
    ).toBeGreaterThan(0)
    expect(
      dictionary.duplicate_student_id(SAMPLE_PARAMS.duplicate_student_id).length,
    ).toBeGreaterThan(0)
    expect(
      dictionary.duplicate_attempt_id(SAMPLE_PARAMS.duplicate_attempt_id).length,
    ).toBeGreaterThan(0)
    expect(
      dictionary.unknown_active_student(SAMPLE_PARAMS.unknown_active_student).length,
    ).toBeGreaterThan(0)
    expect(
      dictionary.unknown_projected_student(SAMPLE_PARAMS.unknown_projected_student).length,
    ).toBeGreaterThan(0)
    expect(
      dictionary.projection_mismatch(SAMPLE_PARAMS.projection_mismatch).length,
    ).toBeGreaterThan(0)
  })

  test('traduit un code de backup', () => {
    expect(
      formatBackupIssue(
        backupError('unsupported_format_version', [], { found: 2, supported: 1 }),
        'fr',
      ),
    ).toContain('mettre à jour')
  })

  test('délègue les issues de config', () => {
    expect(formatBackupIssue(configError('required', ['session', 'name'], {}), 'en')).toBe(
      'Required field is missing.',
    )
  })
})
