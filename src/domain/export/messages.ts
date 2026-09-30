import { t, type Dictionary, type Locale } from '@/lib/i18n/i18n'

type NoParams = Record<string, never>

/**
 * Tous les libellés du classeur (cinq onglets). Toute nouvelle clé s'ajoute en fr et en en ;
 * les libellés des Statistiques reprennent ceux de l'écran F15 (`stats_*` de l'UI).
 */
export type ExportMessageParams = {
  // Noms d'onglets (≤ 31 caractères, sans `: \ / ? * [ ]`).
  sheet_summary: NoParams
  sheet_detail: NoParams
  sheet_stats: NoParams
  sheet_config: NoParams
  sheet_metadata: NoParams
  // En-têtes de la Synthèse.
  col_examiner: NoParams
  col_last_name: NoParams
  col_first_name: NoParams
  col_order: NoParams
  col_status: NoParams
  col_added_during_session: NoParams
  col_raw: NoParams
  col_capped: NoParams
  col_converted: NoParams
  col_adjustment: NoParams
  col_adjustment_reason: NoParams
  col_final: NoParams
  col_comment: NoParams
  // En-têtes du Détail des questions (Catégorie partagée avec les Statistiques).
  col_student: NoParams
  col_rank: NoParams
  col_category: NoParams
  col_question_id: NoParams
  col_question_title: NoParams
  col_tags: NoParams
  col_result: NoParams
  col_points: NoParams
  col_max_points: NoParams
  col_skip_reason: NoParams
  col_drawn_at: NoParams
  col_edited_at: NoParams
  // Statuts, résultats, booléens.
  status_done: NoParams
  status_in_progress: NoParams
  status_todo: NoParams
  status_absent: NoParams
  result_scored: NoParams
  result_skipped: NoParams
  result_pending: NoParams
  yes: NoParams
  no: NoParams
  // Statistiques : titres de bloc.
  stats_headcount: NoParams
  stats_grades: NoParams
  stats_histogram: NoParams
  stats_categories: NoParams
  stats_tags: NoParams
  stats_top_drawn: NoParams
  stats_skipped: NoParams
  stats_strategies: NoParams
  stats_adjustments: NoParams
  // Statistiques : en-têtes.
  stats_headcount_total: NoParams
  stats_headcount_done: NoParams
  stats_headcount_in_progress: NoParams
  stats_headcount_todo: NoParams
  stats_headcount_absent: NoParams
  stats_headcount_added: NoParams
  stats_grades_count: NoParams
  stats_grades_min: NoParams
  stats_grades_max: NoParams
  stats_grades_mean: NoParams
  stats_grades_median: NoParams
  stats_grades_std_dev: NoParams
  stats_col_range: NoParams
  stats_col_count: NoParams
  stats_col_tag: NoParams
  stats_col_question: NoParams
  stats_col_choices: NoParams
  stats_col_scored: NoParams
  stats_col_success_rate: NoParams
  stats_col_draws: NoParams
  stats_col_skips: NoParams
  stats_col_reasons: NoParams
  stats_col_composition: NoParams
  stats_col_students: NoParams
  stats_col_mean_final: NoParams
  stats_adjustments_count: NoParams
  stats_adjustments_sum: NoParams
  stats_adjustments_mean: NoParams
  /** Élément compté : motif de skip, catégorie d'une stratégie (« Facile ×2 »). */
  times: { label: string; count: number }
  no_reason: NoParams
  // Configuration et Métadonnées : paires clé → valeur.
  col_setting: NoParams
  col_value: NoParams
  // Configuration : bloc Catégories.
  config_categories: NoParams
  col_label: NoParams
  col_id: NoParams
  col_questions: NoParams
  col_scale: NoParams
  // Configuration : réglages.
  config_questions_per_student: NoParams
  config_max_raw_score: NoParams
  config_final_scale: NoParams
  config_rounding_mode: NoParams
  config_rounding_step: NoParams
  config_skips_enabled: NoParams
  config_skips_max_per_student: NoParams
  config_skips_reasons: NoParams
  config_skips_free_text: NoParams
  config_absent_mode: NoParams
  config_absent_label: NoParams
  config_absent_value: NoParams
  config_schema_version: NoParams
  // Configuration : valeurs énumérées.
  rounding_nearest: NoParams
  rounding_up: NoParams
  rounding_down: NoParams
  absent_mode_label: NoParams
  absent_mode_zero: NoParams
  absent_mode_value: NoParams
  // Métadonnées.
  meta_session_name: NoParams
  meta_examiner: NoParams
  meta_exam_title: NoParams
  meta_subject: NoParams
  meta_cohort: NoParams
  meta_created_at: NoParams
  meta_exported_at: NoParams
  meta_app_version: NoParams
}

/** Clé d'un libellé d'export. */
export type ExportMessageKey = keyof ExportMessageParams

const fr: Dictionary<ExportMessageParams> = {
  sheet_summary: () => 'Synthèse',
  sheet_detail: () => 'Détail des questions',
  sheet_stats: () => 'Statistiques',
  sheet_config: () => 'Configuration',
  sheet_metadata: () => 'Métadonnées',
  col_examiner: () => 'Examinateur',
  col_last_name: () => 'Nom',
  col_first_name: () => 'Prénom',
  col_order: () => 'Ordre',
  col_status: () => 'Statut',
  col_added_during_session: () => 'Ajouté en cours de session',
  col_raw: () => 'Brute',
  col_capped: () => 'Plafonnée',
  col_converted: () => 'Convertie',
  col_adjustment: () => 'Ajustement',
  col_adjustment_reason: () => 'Justification',
  col_final: () => 'Finale',
  col_comment: () => 'Commentaire',
  col_student: () => 'Étudiant',
  col_rank: () => 'Rang',
  col_category: () => 'Catégorie',
  col_question_id: () => 'Id question',
  col_question_title: () => 'Titre',
  col_tags: () => 'Tags',
  col_result: () => 'Résultat',
  col_points: () => 'Points',
  col_max_points: () => 'Points max',
  col_skip_reason: () => 'Motif',
  col_drawn_at: () => 'Tirée le',
  col_edited_at: () => 'Modifiée le',
  status_done: () => 'Terminé',
  status_in_progress: () => 'En cours',
  status_todo: () => 'À passer',
  status_absent: () => 'Absent',
  result_scored: () => 'Noté',
  result_skipped: () => 'Passé',
  result_pending: () => 'En cours',
  yes: () => 'Oui',
  no: () => 'Non',
  stats_headcount: () => 'Effectifs',
  stats_grades: () => 'Notes finales',
  stats_histogram: () => 'Histogramme',
  stats_categories: () => 'Catégories',
  stats_tags: () => 'Tags',
  stats_top_drawn: () => 'Questions les plus tirées',
  stats_skipped: () => 'Questions passées',
  stats_strategies: () => 'Stratégies',
  stats_adjustments: () => 'Ajustements',
  stats_headcount_total: () => 'Étudiants',
  stats_headcount_done: () => 'Terminés',
  stats_headcount_in_progress: () => 'En cours',
  stats_headcount_todo: () => 'À passer',
  stats_headcount_absent: () => 'Absents',
  stats_headcount_added: () => 'Ajoutés en séance',
  stats_grades_count: () => 'Étudiants notés',
  stats_grades_min: () => 'Minimum',
  stats_grades_max: () => 'Maximum',
  stats_grades_mean: () => 'Moyenne',
  stats_grades_median: () => 'Médiane',
  stats_grades_std_dev: () => 'Écart-type',
  stats_col_range: () => 'Intervalle',
  stats_col_count: () => 'Effectif',
  stats_col_tag: () => 'Tag',
  stats_col_question: () => 'Question',
  stats_col_choices: () => 'Choix',
  stats_col_scored: () => 'Questions notées',
  stats_col_success_rate: () => 'Taux de réussite',
  stats_col_draws: () => 'Tirages',
  stats_col_skips: () => 'Passes',
  stats_col_reasons: () => 'Motifs',
  stats_col_composition: () => 'Composition',
  stats_col_students: () => 'Étudiants',
  stats_col_mean_final: () => 'Note finale moyenne',
  stats_adjustments_count: () => 'Nombre',
  stats_adjustments_sum: () => 'Somme',
  stats_adjustments_mean: () => 'Moyenne',
  times: ({ label, count }) => `${label} ×${count}`,
  no_reason: () => 'sans motif',
  col_setting: () => 'Paramètre',
  col_value: () => 'Valeur',
  config_categories: () => 'Catégories',
  col_label: () => 'Libellé',
  col_id: () => 'Id',
  col_questions: () => 'Questions',
  col_scale: () => 'Barème',
  config_questions_per_student: () => 'Questions par étudiant',
  config_max_raw_score: () => 'Note brute max',
  config_final_scale: () => 'Échelle finale',
  config_rounding_mode: () => 'Arrondi (mode)',
  config_rounding_step: () => 'Arrondi (pas effectif)',
  config_skips_enabled: () => 'Passes activées',
  config_skips_max_per_student: () => 'Passes max par étudiant',
  config_skips_reasons: () => 'Motifs de passe',
  config_skips_free_text: () => 'Motif libre autorisé',
  config_absent_mode: () => 'Absent (mode)',
  config_absent_label: () => 'Absent (libellé)',
  config_absent_value: () => 'Absent (valeur)',
  config_schema_version: () => 'Version du schéma',
  rounding_nearest: () => 'Au plus proche',
  rounding_up: () => 'Supérieur',
  rounding_down: () => 'Inférieur',
  absent_mode_label: () => 'Libellé',
  absent_mode_zero: () => 'Zéro',
  absent_mode_value: () => 'Valeur',
  meta_session_name: () => 'Nom de la session',
  meta_examiner: () => 'Examinateur',
  meta_exam_title: () => 'Titre de l’examen',
  meta_subject: () => 'Matière',
  meta_cohort: () => 'Promotion',
  meta_created_at: () => 'Créée le',
  meta_exported_at: () => 'Exportée le',
  meta_app_version: () => 'Version de l’application',
}

const en: Dictionary<ExportMessageParams> = {
  sheet_summary: () => 'Summary',
  sheet_detail: () => 'Question details',
  sheet_stats: () => 'Statistics',
  sheet_config: () => 'Configuration',
  sheet_metadata: () => 'Metadata',
  col_examiner: () => 'Examiner',
  col_last_name: () => 'Last name',
  col_first_name: () => 'First name',
  col_order: () => 'Order',
  col_status: () => 'Status',
  col_added_during_session: () => 'Added during the session',
  col_raw: () => 'Raw',
  col_capped: () => 'Capped',
  col_converted: () => 'Converted',
  col_adjustment: () => 'Adjustment',
  col_adjustment_reason: () => 'Justification',
  col_final: () => 'Final',
  col_comment: () => 'Comment',
  col_student: () => 'Student',
  col_rank: () => 'Rank',
  col_category: () => 'Category',
  col_question_id: () => 'Question id',
  col_question_title: () => 'Title',
  col_tags: () => 'Tags',
  col_result: () => 'Result',
  col_points: () => 'Points',
  col_max_points: () => 'Max points',
  col_skip_reason: () => 'Reason',
  col_drawn_at: () => 'Drawn at',
  col_edited_at: () => 'Edited at',
  status_done: () => 'Finished',
  status_in_progress: () => 'In progress',
  status_todo: () => 'Not started',
  status_absent: () => 'Absent',
  result_scored: () => 'Scored',
  result_skipped: () => 'Skipped',
  result_pending: () => 'In progress',
  yes: () => 'Yes',
  no: () => 'No',
  stats_headcount: () => 'Headcount',
  stats_grades: () => 'Final scores',
  stats_histogram: () => 'Histogram',
  stats_categories: () => 'Categories',
  stats_tags: () => 'Tags',
  stats_top_drawn: () => 'Most drawn questions',
  stats_skipped: () => 'Skipped questions',
  stats_strategies: () => 'Strategies',
  stats_adjustments: () => 'Adjustments',
  stats_headcount_total: () => 'Students',
  stats_headcount_done: () => 'Finished',
  stats_headcount_in_progress: () => 'In progress',
  stats_headcount_todo: () => 'Not started',
  stats_headcount_absent: () => 'Absent',
  stats_headcount_added: () => 'Added during the session',
  stats_grades_count: () => 'Scored students',
  stats_grades_min: () => 'Minimum',
  stats_grades_max: () => 'Maximum',
  stats_grades_mean: () => 'Mean',
  stats_grades_median: () => 'Median',
  stats_grades_std_dev: () => 'Standard deviation',
  stats_col_range: () => 'Range',
  stats_col_count: () => 'Count',
  stats_col_tag: () => 'Tag',
  stats_col_question: () => 'Question',
  stats_col_choices: () => 'Picks',
  stats_col_scored: () => 'Scored questions',
  stats_col_success_rate: () => 'Success rate',
  stats_col_draws: () => 'Draws',
  stats_col_skips: () => 'Skips',
  stats_col_reasons: () => 'Reasons',
  stats_col_composition: () => 'Composition',
  stats_col_students: () => 'Students',
  stats_col_mean_final: () => 'Mean final score',
  stats_adjustments_count: () => 'Count',
  stats_adjustments_sum: () => 'Sum',
  stats_adjustments_mean: () => 'Mean',
  times: ({ label, count }) => `${label} ×${count}`,
  no_reason: () => 'no reason',
  col_setting: () => 'Setting',
  col_value: () => 'Value',
  config_categories: () => 'Categories',
  col_label: () => 'Label',
  col_id: () => 'Id',
  col_questions: () => 'Questions',
  col_scale: () => 'Scale',
  config_questions_per_student: () => 'Questions per student',
  config_max_raw_score: () => 'Max raw score',
  config_final_scale: () => 'Final scale',
  config_rounding_mode: () => 'Rounding (mode)',
  config_rounding_step: () => 'Rounding (effective step)',
  config_skips_enabled: () => 'Skips enabled',
  config_skips_max_per_student: () => 'Max skips per student',
  config_skips_reasons: () => 'Skip reasons',
  config_skips_free_text: () => 'Free-text reason allowed',
  config_absent_mode: () => 'Absent (mode)',
  config_absent_label: () => 'Absent (label)',
  config_absent_value: () => 'Absent (value)',
  config_schema_version: () => 'Schema version',
  rounding_nearest: () => 'Nearest',
  rounding_up: () => 'Up',
  rounding_down: () => 'Down',
  absent_mode_label: () => 'Label',
  absent_mode_zero: () => 'Zero',
  absent_mode_value: () => 'Value',
  meta_session_name: () => 'Session name',
  meta_examiner: () => 'Examiner',
  meta_exam_title: () => 'Exam title',
  meta_subject: () => 'Subject',
  meta_cohort: () => 'Cohort',
  meta_created_at: () => 'Created at',
  meta_exported_at: () => 'Exported at',
  meta_app_version: () => 'App version',
}

/** Dictionnaires fr et en de l'export. */
export const EXPORT_MESSAGES: Record<Locale, Dictionary<ExportMessageParams>> = { fr, en }

/** Clés des noms d'onglets, dans l'ordre du classeur. */
export const SHEET_NAME_KEYS = [
  'sheet_summary',
  'sheet_detail',
  'sheet_stats',
  'sheet_config',
  'sheet_metadata',
] as const satisfies readonly ExportMessageKey[]

/** Libellé d'export dans la langue donnée. */
export function exportText<K extends ExportMessageKey>(
  locale: Locale,
  key: K,
  params: ExportMessageParams[K],
): string {
  return t(EXPORT_MESSAGES, locale, key, params)
}
