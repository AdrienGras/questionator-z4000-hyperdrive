import { describe, expect, test } from 'vitest'
import { SUPPORTED_LOCALES, t } from './i18n'
import { UI_MESSAGES, type UiMessageParams } from './ui-messages'

const SAMPLE: UiMessageParams = {
  app_title: {},
  not_found_title: {},
  back_home: {},
  home_create: {},
  home_import: {},
  persistence_warning_label: {},
  persistence_warning: {},
  db_outdated: {},
  db_reload: {},
  db_unavailable: {},
  color_mode_label: { mode: 'Clair' },
  color_mode_light: {},
  color_mode_dark: {},
  color_mode_system: {},
  session_loading: {},
  session_not_found: {},
  present_waiting: {},
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
  markdown_footnotes: {},
  markdown_footnote_back: { n: '1' },
  passage_question_index: { current: 1, total: 3 },
  passage_raw_score: { score: '2,5' },
  passage_categories: {},
  passage_category_max: { max: '2' },
  passage_category_exhausted: {},
  passage_answer: {},
  passage_score_heading: {},
  passage_score_button: { value: '0,5' },
  passage_status_todo: {},
  passage_status_in_progress: {},
  passage_status_done: {},
  passage_status_absent: {},
  passage_no_student_title: {},
  passage_no_student_body: {},
  passage_absent_title: {},
  passage_absent_body: {},
  passage_done_title: {},
  final_scores_heading: {},
  final_detail_heading: {},
  final_raw: {},
  final_capped: {},
  final_converted: {},
  final_adjustment: {},
  final_final: {},
  final_no_adjustment: {},
  final_score: { value: '14,5', scale: '20' },
  final_points: { score: '2', max: '3' },
  final_skipped: {},
  final_skipped_reason: { reason: 'Hors programme' },
  final_adjust: {},
  final_reset: {},
  final_next: {},
  final_no_next: {},
  attempt_pending: {},
  attempt_score_label: { rank: 1 },
  attempt_out_of: { max: '2' },
  score_not_computed: {},
  side_panel_label: {},
  side_panel_hide: {},
  side_panel_show: {},
  side_panel_tab_student: {},
  side_panel_tab_students: {},
  students_list_label: {},
  students_projected: {},
  students_row_scores: { raw: '2', final: '12,5' },
  students_add: {},
  students_add_title: {},
  students_add_last_name: {},
  students_add_first_name: {},
  students_add_submit: {},
  students_add_and_start: {},
  students_add_duplicate: { name: 'Durand Élodie' },
  student_tab_questions: {},
  student_tab_totals: {},
  student_tab_no_student: {},
  student_tab_no_attempts: {},
  comment_label: {},
  comment_saving: {},
  comment_saved: {},
  comment_error: {},
  absent_label: {},
  absent_title: { name: 'Durand Alice' },
  absent_body: { count: 2 },
  absent_confirm: {},
  reset_title: { name: 'Durand Alice' },
  reset_body: {},
  reset_confirm: {},
  adjust_title: {},
  adjust_field: {},
  adjust_decrement: {},
  adjust_increment: {},
  adjust_invalid: { step: '0,5', max: '20' },
  adjust_preview: { converted: '13,5', sign: '+', adjustment: '1,0', final: '14,5', scale: '20' },
  adjust_clamped: { bound: '20' },
  adjust_reason: {},
  passage_error_generic: {},
  passage_skip_button: { remaining: 1 },
  passage_skip_quota_reached: {},
  passage_skip_title: {},
  passage_skip_body: {},
  passage_skip_reasons: {},
  passage_skip_free_text: {},
  passage_skip_confirm: {},
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

  test('absent_body accorde le singulier et le pluriel', () => {
    expect(t(UI_MESSAGES, 'fr', 'absent_body', { count: 1 })).toContain('1 question tirée.')
    expect(t(UI_MESSAGES, 'fr', 'absent_body', { count: 2 })).toContain('2 questions tirées.')
    expect(t(UI_MESSAGES, 'en', 'absent_body', { count: 1 })).toContain('1 drawn question.')
    expect(t(UI_MESSAGES, 'en', 'absent_body', { count: 2 })).toContain('2 drawn questions.')
  })
})
