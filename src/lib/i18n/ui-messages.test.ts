import { describe, expect, test } from 'vitest'
import { SUPPORTED_LOCALES, t } from './i18n'
import { UI_MESSAGES, type UiMessageParams } from './ui-messages'

const SAMPLE: UiMessageParams = {
  app_title: {},
  not_found_title: {},
  back_home: {},
  home_create: {},
  home_import: {},
  home_actions_title: {},
  home_sessions_title: {},
  home_create_title: {},
  home_create_body: {},
  home_students_example_link: {},
  home_config_example_link: {},
  create_config_example_link: {},
  home_config_schema_link: {},
  home_import_title: {},
  home_import_body: {},
  home_editor_title: {},
  home_editor_body: {},
  home_editor_open: {},
  persistence_warning_label: {},
  persistence_warning: {},
  db_outdated: {},
  db_reload: {},
  db_unavailable: {},
  update_available: {},
  update_reload: {},
  offline_ready: {},
  offline_ready_dismiss: {},
  color_mode_label: { mode: 'Clair' },
  color_mode_light: {},
  color_mode_dark: {},
  color_mode_system: {},
  help_link: {},
  help_link_label: {},
  session_loading: {},
  session_not_found: {},
  damaged_title: {},
  damaged_badge: {},
  damaged_body: {},
  damaged_details: {},
  present_waiting: {},
  present_prompt_label: {},
  present_question_index: { current: 1, total: 3 },
  present_cumulative: { score: '3,5' },
  present_finished: {},
  present_final: { value: '14', scale: '20' },
  present_raw: { value: '7' },
  present_category_exhausted: {},
  present_category_unavailable: {},
  present_skipped: {},
  present_fullscreen: {},
  present_exit_fullscreen: {},
  empty_title: {},
  empty_body: {},
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
  import_conflict_damaged_body: { existing: 'Ada', imported: 'Bob' },
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
  training_setup_title: {},
  training_setup_gather_title: {},
  training_setup_gather_body: {},
  training_setup_prompt_title: {},
  training_setup_prompt_label: {},
  training_setup_prompt_hint: {},
  training_setup_copy: {},
  training_setup_copied: {},
  training_setup_copy_failed: {},
  training_setup_config_title: {},
  training_setup_config_body: {},
  training_setup_drop_title: {},
  training_setup_file_label: {},
  training_setup_paste_label: {},
  training_setup_check_paste: {},
  training_setup_category_count: { label: 'Facile', count: 2 },
  training_setup_fix_in_editor: {},
  training_setup_submit: {},
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
  passage_category_max: { max: '2', points: 2 },
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
  side_panel_open: {},
  side_panel_close: {},
  side_panel_show: {},
  side_panel_tab_student: {},
  side_panel_tab_students: {},
  students_list_label: {},
  students_projected: {},
  projection_open: {},
  projection_project: {},
  projection_waiting: {},
  projection_preview_label: {},
  projection_banner: { name: 'Ada Lovelace' },
  projection_popup_blocked: {},
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
  absent_mark: {},
  absent_unmark: {},
  absent_mark_named: { name: 'Durand Alice' },
  absent_unmark_named: { name: 'Durand Alice' },
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
  stats_open: {},
  stats_back: {},
  stats_error: {},
  stats_headcount: {},
  stats_headcount_total: {},
  stats_headcount_done: {},
  stats_headcount_in_progress: {},
  stats_headcount_todo: {},
  stats_headcount_absent: {},
  stats_headcount_added: {},
  stats_grades: {},
  stats_grades_count: {},
  stats_grades_min: {},
  stats_grades_max: {},
  stats_grades_mean: {},
  stats_grades_median: {},
  stats_grades_std_dev: {},
  stats_histogram: {},
  stats_histogram_empty: {},
  stats_col_range: {},
  stats_categories: {},
  stats_tags: {},
  stats_tags_empty: {},
  stats_top_drawn: {},
  stats_top_drawn_empty: {},
  stats_skipped: {},
  stats_skipped_empty: {},
  stats_strategies: {},
  stats_strategies_empty: {},
  stats_adjustments: {},
  stats_adjustments_count: {},
  stats_adjustments_sum: {},
  stats_adjustments_mean: {},
  stats_col_category: {},
  stats_col_tag: {},
  stats_col_question: {},
  stats_col_choices: {},
  stats_col_scored: {},
  stats_col_success_rate: {},
  stats_col_draws: {},
  stats_col_skips: {},
  stats_col_reasons: {},
  stats_col_composition: {},
  stats_col_students: {},
  stats_col_mean_final: {},
  stats_times: { label: 'Facile', count: 2 },
  stats_no_reason: {},
  export_button: {},
  export_busy: {},
  export_error: {},
  editor_title: {},
  editor_label: {},
  editor_source_title: {},
  editor_preview_title: {},
  editor_load_file: {},
  editor_reset_example: {},
  editor_download: {},
  editor_create_session: {},
  editor_issues_none: {},
  editor_issues_count: { errors: 2, warnings: 1 },
  editor_preview_stale: {},
  editor_preview_empty: {},
  editor_expected_answer: {},
  editor_final_screen: {},
  editor_validator_error: {},
  editor_hover_default: {},
  editor_hover_values: {},
  editor_hover_icon_search: {},
  editor_hover_icon_hint: {},
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

  test('passage_category_max : « pts » au pluriel, « pt » pour une valeur de 1, même formatée « 1,0 »', () => {
    expect(t(UI_MESSAGES, 'fr', 'passage_category_max', { max: '2', points: 2 })).toBe('2 pts')
    expect(t(UI_MESSAGES, 'fr', 'passage_category_max', { max: '1', points: 1 })).toBe('1 pt')
    expect(t(UI_MESSAGES, 'fr', 'passage_category_max', { max: '1,0', points: 1 })).toBe('1,0 pt')
    expect(t(UI_MESSAGES, 'fr', 'passage_category_max', { max: '2,5', points: 2.5 })).toBe(
      '2,5 pts',
    )
    // Singulier sous 2 en français (#118) : « 0,5 pt », « 1,5 pt ».
    expect(t(UI_MESSAGES, 'fr', 'passage_category_max', { max: '0,5', points: 0.5 })).toBe('0,5 pt')
    expect(t(UI_MESSAGES, 'fr', 'passage_category_max', { max: '1,5', points: 1.5 })).toBe('1,5 pt')
    expect(t(UI_MESSAGES, 'en', 'passage_category_max', { max: '1.5', points: 1.5 })).toBe(
      '1.5 pts',
    )
    expect(t(UI_MESSAGES, 'en', 'passage_category_max', { max: '2', points: 2 })).toBe('2 pts')
    expect(t(UI_MESSAGES, 'en', 'passage_category_max', { max: '1.0', points: 1 })).toBe('1.0 pt')
  })

  test('absent_body accorde le singulier et le pluriel', () => {
    expect(t(UI_MESSAGES, 'fr', 'absent_body', { count: 1 })).toContain('1 question tirée.')
    expect(t(UI_MESSAGES, 'fr', 'absent_body', { count: 2 })).toContain('2 questions tirées.')
    expect(t(UI_MESSAGES, 'en', 'absent_body', { count: 1 })).toContain('1 drawn question.')
    expect(t(UI_MESSAGES, 'en', 'absent_body', { count: 2 })).toContain('2 drawn questions.')
  })
})
