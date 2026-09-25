import { describe, expect, test } from 'vitest'
import { SUPPORTED_LOCALES, t } from './index'
import { UI_MESSAGES, type UiMessageParams } from './ui-messages'

const SAMPLE: UiMessageParams = {
  app_title: {},
  not_found_title: {},
  back_home: {},
  coming_soon_title: {},
  coming_soon_body: {},
  home_create: {},
  home_import: {},
  persistence_warning_label: {},
  persistence_warning: {},
  db_outdated: {},
  db_reload: {},
  db_unavailable: {},
  empty_title: {},
  empty_body: {},
  empty_example_link: {},
  empty_students_example_link: {},
  card_examiner: { name: 'Ada' },
  card_updated: { date: '01/01/2026' },
  card_progress: { done: 3, absent: 1, remaining: 2 },
  card_resume: {},
  card_actions: { name: 'Ada' },
  action_rename: {},
  action_edit_examiner: {},
  action_export: {},
  action_delete: {},
  rename_title: {},
  rename_label: {},
  examiner_title: {},
  examiner_label: {},
  examiner_hint: {},
  dialog_save: {},
  dialog_cancel: {},
  dialog_close: {},
  write_error: {},
  delete_title: { name: 'Ada' },
  delete_body: {},
  delete_export_first: {},
  delete_confirm: {},
  import_drop_hint: {},
  import_error_title: { fileName: 'backup.json' },
  import_read_error: {},
  import_load_error: {},
  import_conflict_title: {},
  import_conflict_body: { existing: 'Ada', date: '01/01/2026', imported: 'Bob' },
  import_replace: {},
  create_title: {},
  create_students_label: {},
  create_config_label: {},
  create_choose_file: {},
  create_replace_file: {},
  create_drop_hint: {},
  create_file_status_ok: {},
  create_file_status_warnings: {},
  create_file_status_errors: {},
  create_file_status_reading: {},
  create_students_example_link: {},
  create_validator_load_error: {},
  create_submit: {},
  create_write_error: {},
  create_preview_title: {},
  create_preview_empty: {},
  preview_students_count: { count: 2 },
  preview_students_list: {},
  preview_line: { line: 3, message: 'Doublon' },
  preview_config_title: {},
  preview_subject: { subject: 'PHP' },
  preview_cohort: { cohort: 'B2' },
  preview_category: { label: 'A', questions: 3, scale: '0, 1, 2' },
  preview_scoring: { questionsPerStudent: 3, maxRawScore: 6, finalScale: 20 },
  preview_rounding: { mode: 'nearest', step: 0.5, decimals: 2 },
  preview_skips_disabled: {},
  preview_skips: { max: 1 },
}

function isUiMessageKey(key: string): key is keyof UiMessageParams {
  return key in SAMPLE
}

describe('UI_MESSAGES', () => {
  test.each(SUPPORTED_LOCALES)(
    'toutes les clés de fr existent en %s et rendent une chaîne non vide',
    (locale) => {
      for (const key of Object.keys(UI_MESSAGES.fr)) {
        if (!isUiMessageKey(key)) throw new Error(`clé inattendue : ${key}`)
        expect(UI_MESSAGES[locale]).toHaveProperty(key)
        const value = t(UI_MESSAGES, locale, key, SAMPLE[key])
        expect(typeof value).toBe('string')
        expect(value.length).toBeGreaterThan(0)
      }
    },
  )

  test('card_progress accorde le singulier et le pluriel en fr', () => {
    expect(t(UI_MESSAGES, 'fr', 'card_progress', { done: 1, absent: 0, remaining: 0 })).toContain(
      '1 passé ',
    )
    expect(t(UI_MESSAGES, 'fr', 'card_progress', { done: 2, absent: 0, remaining: 0 })).toContain(
      '2 passés',
    )
    expect(t(UI_MESSAGES, 'fr', 'card_progress', { done: 0, absent: 1, remaining: 0 })).toContain(
      '1 absent ',
    )
    expect(t(UI_MESSAGES, 'fr', 'card_progress', { done: 0, absent: 2, remaining: 0 })).toContain(
      '2 absents',
    )
    expect(t(UI_MESSAGES, 'fr', 'card_progress', { done: 0, absent: 0, remaining: 1 })).toContain(
      '1 restant',
    )
    expect(t(UI_MESSAGES, 'fr', 'card_progress', { done: 0, absent: 0, remaining: 2 })).toContain(
      '2 restants',
    )
  })

  test('create_file_status_reading : libellé de lecture en fr et en en', () => {
    expect(t(UI_MESSAGES, 'fr', 'create_file_status_reading', {})).toBe('Lecture en cours…')
    expect(t(UI_MESSAGES, 'en', 'create_file_status_reading', {})).toBe('Reading…')
  })

  test('preview_students_count accorde le singulier et le pluriel en fr', () => {
    expect(t(UI_MESSAGES, 'fr', 'preview_students_count', { count: 1 })).toBe('1 étudiant')
    expect(t(UI_MESSAGES, 'fr', 'preview_students_count', { count: 2 })).toBe('2 étudiants')
    expect(t(UI_MESSAGES, 'en', 'preview_students_count', { count: 1 })).toBe('1 student')
    expect(t(UI_MESSAGES, 'en', 'preview_students_count', { count: 2 })).toBe('2 students')
  })

  test('preview_rounding : forme « au pas de » et forme « à N décimales »', () => {
    expect(
      t(UI_MESSAGES, 'fr', 'preview_rounding', { mode: 'nearest', step: 0.5, decimals: 2 }),
    ).toBe('Arrondi au plus proche, au pas de 0,5')
    expect(t(UI_MESSAGES, 'fr', 'preview_rounding', { mode: 'up', step: null, decimals: 2 })).toBe(
      'Arrondi supérieur, à 2 décimales',
    )
    expect(
      t(UI_MESSAGES, 'fr', 'preview_rounding', { mode: 'down', step: null, decimals: 1 }),
    ).toBe('Arrondi inférieur, à 1 décimale')
    expect(
      t(UI_MESSAGES, 'en', 'preview_rounding', { mode: 'nearest', step: 0.5, decimals: 2 }),
    ).toBe('Rounded to nearest, step 0.5')
    expect(t(UI_MESSAGES, 'en', 'preview_rounding', { mode: 'up', step: null, decimals: 2 })).toBe(
      'Rounded up, 2 decimals',
    )
  })
})
