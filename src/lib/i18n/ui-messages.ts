import type { Dictionary, Locale } from './i18n'

type NoParams = Record<string, never>

export type UiMessageParams = {
  app_title: NoParams
  not_found_title: NoParams
  back_home: NoParams
  home_create: NoParams
  home_import: NoParams
  home_actions_title: NoParams
  home_sessions_title: NoParams
  home_create_title: NoParams
  home_create_body: NoParams
  home_students_example_link: NoParams
  home_config_example_link: NoParams
  home_config_schema_link: NoParams
  home_import_title: NoParams
  home_import_body: NoParams
  persistence_warning_label: NoParams
  persistence_warning: NoParams
  db_outdated: NoParams
  db_reload: NoParams
  db_unavailable: NoParams
  update_available: NoParams
  update_reload: NoParams
  color_mode_label: { mode: string }
  color_mode_light: NoParams
  color_mode_dark: NoParams
  color_mode_system: NoParams
  session_loading: NoParams
  session_not_found: NoParams
  present_waiting: NoParams
  present_prompt_label: NoParams
  present_question_index: { current: number; total: number }
  present_cumulative: { score: string }
  present_finished: NoParams
  present_final: { value: string; scale: string }
  present_raw: { value: string }
  present_category_exhausted: NoParams
  present_skipped: NoParams
  present_fullscreen: NoParams
  present_exit_fullscreen: NoParams
  empty_title: NoParams
  empty_body: NoParams
  card_examiner: { name: string }
  card_updated: { date: string }
  card_progress: { done: number; absent: number; remaining: number }
  card_resume: NoParams
  card_actions: { name: string }
  action_rename: NoParams
  action_edit_examiner: NoParams
  action_export: NoParams
  action_delete: NoParams
  rename_title: NoParams
  rename_label: NoParams
  examiner_title: NoParams
  examiner_label: NoParams
  examiner_hint: NoParams
  dialog_save: NoParams
  dialog_cancel: NoParams
  dialog_close: NoParams
  write_error: NoParams
  delete_title: { name: string }
  delete_body: NoParams
  delete_export_first: NoParams
  delete_confirm: NoParams
  import_drop_hint: NoParams
  import_error_title: { fileName: string }
  import_read_error: NoParams
  import_load_error: NoParams
  import_conflict_title: NoParams
  import_conflict_body: { existing: string; date: string; imported: string }
  import_replace: NoParams
  create_title: NoParams
  create_students_label: NoParams
  create_config_label: NoParams
  create_choose_file: NoParams
  create_replace_file: NoParams
  create_drop_hint: NoParams
  create_file_status_ok: NoParams
  create_file_status_warnings: NoParams
  create_file_status_errors: NoParams
  create_file_status_reading: NoParams
  create_students_example_link: NoParams
  create_config_example_link: NoParams
  create_validator_load_error: NoParams
  create_submit: NoParams
  create_write_error: NoParams
  create_preview_title: NoParams
  create_preview_empty: NoParams
  preview_students_count: { count: number }
  preview_students_list: NoParams
  preview_line: { line: number; message: string }
  preview_config_title: NoParams
  preview_subject: { subject: string }
  preview_cohort: { cohort: string }
  /** `scale` : barème déjà mis en forme par l'appelant (`category.scale.join(', ')`). */
  preview_category: { label: string; questions: number; scale: string }
  preview_scoring: { questionsPerStudent: number; maxRawScore: number; finalScale: number }
  preview_rounding: RoundingParams
  preview_skips_disabled: NoParams
  preview_skips: { max: number }
  markdown_footnotes: NoParams
  /** `n` : numéro de la référence (1-based), avec suffixe `-n` de la re-référence si > 1. */
  markdown_footnote_back: { n: string }
  passage_question_index: { current: number; total: number }
  /** `score` : score brut déjà mis en forme par l'appelant (`formatScore(raw, 'raw', config, locale)`). */
  passage_raw_score: { score: string }
  passage_categories: NoParams
  /** `max` : plus grande valeur du barème, déjà mise en forme par l'appelant. */
  passage_category_max: { max: string }
  passage_category_exhausted: NoParams
  passage_answer: NoParams
  passage_score_heading: NoParams
  /** `value` : valeur du barème déjà mise en forme par l'appelant. */
  passage_score_button: { value: string }
  passage_status_todo: NoParams
  passage_status_in_progress: NoParams
  passage_status_done: NoParams
  passage_status_absent: NoParams
  passage_no_student_title: NoParams
  passage_no_student_body: NoParams
  passage_absent_title: NoParams
  passage_absent_body: NoParams
  passage_done_title: NoParams
  final_scores_heading: NoParams
  final_detail_heading: NoParams
  final_raw: NoParams
  final_capped: NoParams
  final_converted: NoParams
  final_adjustment: NoParams
  final_final: NoParams
  final_no_adjustment: NoParams
  /** `value` : note formatée ; `scale` : échelle finale. */
  final_score: { value: string; scale: string }
  /** `score` / `max` : points de la question et maximum du barème, déjà formatés. */
  final_points: { score: string; max: string }
  final_skipped: NoParams
  final_skipped_reason: { reason: string }
  final_adjust: NoParams
  final_reset: NoParams
  final_next: NoParams
  final_no_next: NoParams
  attempt_pending: NoParams
  attempt_score_label: { rank: number }
  attempt_out_of: { max: string }
  score_not_computed: NoParams
  side_panel_label: NoParams
  side_panel_open: NoParams
  side_panel_close: NoParams
  side_panel_show: NoParams
  side_panel_tab_student: NoParams
  side_panel_tab_students: NoParams
  students_list_label: NoParams
  students_projected: NoParams
  projection_open: NoParams
  projection_project: NoParams
  projection_waiting: NoParams
  projection_banner: { name: string }
  projection_popup_blocked: NoParams
  projection_preview_label: NoParams
  students_row_scores: { raw: string; final: string }
  students_add: NoParams
  students_add_title: NoParams
  students_add_last_name: NoParams
  students_add_first_name: NoParams
  students_add_submit: NoParams
  students_add_and_start: NoParams
  students_add_duplicate: { name: string }
  student_tab_questions: NoParams
  student_tab_totals: NoParams
  student_tab_no_student: NoParams
  student_tab_no_attempts: NoParams
  comment_label: NoParams
  comment_saving: NoParams
  comment_saved: NoParams
  comment_error: NoParams
  absent_label: NoParams
  absent_title: { name: string }
  /** `count` : nombre de questions tirées que la déclaration d'absence supprime. */
  absent_body: { count: number }
  absent_confirm: NoParams
  reset_title: { name: string }
  reset_body: NoParams
  reset_confirm: NoParams
  adjust_title: NoParams
  adjust_field: NoParams
  adjust_decrement: NoParams
  adjust_increment: NoParams
  /** `step` / `max` : pas d'arrondi et échelle finale, déjà formatés. */
  adjust_invalid: { step: string; max: string }
  /** Notes déjà formatées ; `sign` : « + » ou « − », `adjustment` en valeur absolue. */
  adjust_preview: {
    converted: string
    sign: string
    adjustment: string
    final: string
    scale: string
  }
  adjust_clamped: { bound: string }
  adjust_reason: NoParams
  passage_error_generic: NoParams
  /** `remaining` : passes restantes pour l'étudiant (`skipsRemaining`). */
  passage_skip_button: { remaining: number }
  passage_skip_quota_reached: NoParams
  passage_skip_title: NoParams
  passage_skip_body: NoParams
  passage_skip_reasons: NoParams
  passage_skip_free_text: NoParams
  passage_skip_confirm: NoParams
  stats_open: NoParams
  export_button: NoParams
  export_busy: NoParams
  export_error: NoParams
  editor_title: NoParams
  editor_label: NoParams
  editor_source_title: NoParams
  editor_preview_title: NoParams
  editor_load_file: NoParams
  editor_reset_example: NoParams
  editor_download: NoParams
  editor_create_session: NoParams
  editor_issues_none: NoParams
  editor_issues_count: { errors: number; warnings: number }
  editor_preview_stale: NoParams
  editor_preview_empty: NoParams
  editor_expected_answer: NoParams
  editor_final_screen: NoParams
  stats_back: NoParams
  stats_error: NoParams
  stats_headcount: NoParams
  stats_headcount_total: NoParams
  stats_headcount_done: NoParams
  stats_headcount_in_progress: NoParams
  stats_headcount_todo: NoParams
  stats_headcount_absent: NoParams
  stats_headcount_added: NoParams
  stats_grades: NoParams
  stats_grades_count: NoParams
  stats_grades_min: NoParams
  stats_grades_max: NoParams
  stats_grades_mean: NoParams
  stats_grades_median: NoParams
  stats_grades_std_dev: NoParams
  stats_histogram: NoParams
  stats_histogram_empty: NoParams
  stats_col_range: NoParams
  stats_categories: NoParams
  stats_tags: NoParams
  stats_tags_empty: NoParams
  stats_top_drawn: NoParams
  stats_top_drawn_empty: NoParams
  stats_skipped: NoParams
  stats_skipped_empty: NoParams
  stats_strategies: NoParams
  stats_strategies_empty: NoParams
  stats_adjustments: NoParams
  stats_adjustments_count: NoParams
  stats_adjustments_sum: NoParams
  stats_adjustments_mean: NoParams
  stats_col_category: NoParams
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
  /** Élément compté : motif de skip, catégorie d'une stratégie (« Facile ×2 »). */
  stats_times: { label: string; count: number }
  stats_no_reason: NoParams
}

type RoundingMode = 'nearest' | 'up' | 'down'
type RoundingParams = { mode: RoundingMode; step: number | null; decimals: number }

const plural = (count: number, one: string, many: string) => (count > 1 ? many : one)
const pluralEn = (count: number, one: string, many: string) => (count === 1 ? one : many)

const ROUNDING_MODE_FR: Record<RoundingMode, string> = {
  nearest: 'au plus proche',
  up: 'supérieur',
  down: 'inférieur',
}
const ROUNDING_MODE_EN: Record<RoundingMode, string> = {
  nearest: 'to nearest',
  up: 'up',
  down: 'down',
}

/** Pas d'arrondi s'il est défini, sinon nombre de décimales. */
function roundingFr({ mode, step, decimals }: RoundingParams): string {
  const precision =
    step === null
      ? `à ${decimals} ${plural(decimals, 'décimale', 'décimales')}`
      : `au pas de ${step.toLocaleString('fr')}`
  return `Arrondi ${ROUNDING_MODE_FR[mode]}, ${precision}`
}

function roundingEn({ mode, step, decimals }: RoundingParams): string {
  const precision =
    step === null
      ? `${decimals} ${pluralEn(decimals, 'decimal', 'decimals')}`
      : `step ${step.toLocaleString('en')}`
  return `Rounded ${ROUNDING_MODE_EN[mode]}, ${precision}`
}

const fr: Dictionary<UiMessageParams> = {
  app_title: () => 'Questionator Z-4000 Hyperdrive',
  not_found_title: () => 'Page introuvable',
  back_home: () => "Retour à l'accueil",
  home_create: () => 'Créer une session',
  home_import: () => 'Importer un backup',
  home_actions_title: () => 'Actions',
  home_sessions_title: () => 'Sessions',
  home_create_title: () => 'Nouvelle session',
  home_create_body: () =>
    "Partez d'une liste d'étudiants (CSV nom / prénom) et d'un fichier de configuration (JSON : catégories, questions, barèmes).",
  home_students_example_link: () => "Télécharger la liste d'étudiants d'exemple",
  home_config_example_link: () => "Télécharger la config d'exemple",
  home_config_schema_link: () => 'JSON Schema de la config',
  home_import_title: () => 'Restaurer une session',
  home_import_body: () =>
    "Restaurez une session à partir d'un fichier .json créé par « Exporter un backup ». Vous pouvez aussi déposer le fichier n'importe où sur la page.",
  persistence_warning_label: () => 'Stockage non garanti',
  persistence_warning: () =>
    "Le navigateur n'a pas garanti la conservation des données : il peut effacer vos sessions s'il manque d'espace. Exportez régulièrement un backup.",
  db_outdated: () =>
    "L'application a été mise à jour dans un autre onglet. Rechargez la page pour continuer.",
  db_reload: () => 'Recharger',
  db_unavailable: () =>
    'Le stockage local est indisponible (navigation privée ou cookies bloqués ?). Les sessions ne peuvent pas être enregistrées.',
  update_available: () => 'Nouvelle version disponible',
  update_reload: () => 'Recharger',
  color_mode_label: ({ mode }) => `Mode d'affichage : ${mode.toLocaleLowerCase('fr')}`,
  color_mode_light: () => 'Clair',
  color_mode_dark: () => 'Sombre',
  color_mode_system: () => 'Système',
  session_loading: () => 'Chargement de la session…',
  session_not_found: () => 'Session introuvable',
  present_waiting: () => "L'épreuve va bientôt commencer.",
  present_prompt_label: () => 'Question en cours',
  present_question_index: ({ current, total }) => `Question ${current} / ${total}`,
  present_cumulative: ({ score }) => `Score : ${score}`,
  present_finished: () => 'Passage terminé',
  present_final: ({ value, scale }) => `Note : ${value} / ${scale}`,
  present_raw: ({ value }) => `Score brut : ${value}`,
  present_category_exhausted: () => 'Épuisée',
  present_skipped: () => 'Passée',
  present_fullscreen: () => 'Plein écran',
  present_exit_fullscreen: () => 'Quitter le plein écran',
  empty_title: () => 'Aucune session',
  empty_body: () => 'Créez une session ou importez un backup depuis les actions.',
  card_examiner: ({ name }) => `Jury : ${name}`,
  card_updated: ({ date }) => `Modifiée le ${date}`,
  card_progress: ({ done, absent, remaining }) =>
    `${done} ${plural(done, 'passé', 'passés')} · ${absent} ${plural(absent, 'absent', 'absents')} · ${remaining} ${plural(remaining, 'restant', 'restants')}`,
  card_resume: () => 'Reprendre',
  card_actions: ({ name }) => `Actions pour « ${name} »`,
  action_rename: () => 'Renommer',
  action_edit_examiner: () => "Modifier l'examinateur",
  action_export: () => 'Exporter un backup',
  action_delete: () => 'Supprimer',
  rename_title: () => 'Renommer la session',
  rename_label: () => 'Nom de la session',
  examiner_title: () => "Modifier l'examinateur",
  examiner_label: () => "Nom de l'examinateur",
  examiner_hint: () => 'Facultatif. Repris en colonne dans les exports.',
  dialog_save: () => 'Enregistrer',
  dialog_cancel: () => 'Annuler',
  dialog_close: () => 'Fermer',
  write_error: () =>
    "L'enregistrement a échoué. La session a peut-être été supprimée dans un autre onglet.",
  delete_title: ({ name }) => `Supprimer « ${name} » ?`,
  delete_body: () => 'Cette action est définitive : tous les passages de la session seront perdus.',
  delete_export_first: () => "Exporter un backup d'abord",
  delete_confirm: () => 'Supprimer',
  import_drop_hint: () => 'Déposez le backup ici',
  import_error_title: ({ fileName }) => `Import impossible : ${fileName}`,
  import_read_error: () => "Le fichier n'a pas pu être lu.",
  import_load_error: () => "L'import n'a pas pu démarrer. Rechargez la page et réessayez.",
  import_conflict_title: () => 'Session déjà présente',
  import_conflict_body: ({ existing, date, imported }) =>
    `Une session « ${existing} » (modifiée le ${date}) porte le même identifiant. La remplacer par « ${imported} » ?`,
  import_replace: () => 'Remplacer',
  create_title: () => 'Nouvelle session',
  create_students_label: () => "Liste d'étudiants (CSV)",
  create_config_label: () => 'Configuration (JSON)',
  create_choose_file: () => 'Choisir un fichier',
  create_replace_file: () => 'Remplacer',
  create_drop_hint: () => 'ou déposez-le ici',
  create_file_status_ok: () => 'Fichier valide',
  create_file_status_warnings: () => 'Fichier valide, avec avertissements',
  create_file_status_errors: () => 'Fichier invalide',
  create_file_status_reading: () => 'Lecture en cours…',
  create_students_example_link: () => "Télécharger la liste d'exemple",
  create_config_example_link: () => "Télécharger la config d'exemple",
  create_validator_load_error: () => "La validation n'a pas pu démarrer. Rechargez la page.",
  create_submit: () => 'Créer la session',
  create_write_error: () => 'La création a échoué. Réessayez.',
  create_preview_title: () => 'Aperçu',
  create_preview_empty: () =>
    "Déposez une liste d'étudiants et une configuration pour voir l'aperçu.",
  preview_students_count: ({ count }) => `${count} ${plural(count, 'étudiant', 'étudiants')}`,
  preview_students_list: () => 'Voir la liste',
  preview_line: ({ line, message }) => `Ligne ${line} : ${message}`,
  preview_config_title: () => 'Configuration',
  preview_subject: ({ subject }) => `Matière : ${subject}`,
  preview_cohort: ({ cohort }) => `Promotion : ${cohort}`,
  preview_category: ({ label, questions, scale }) =>
    `${label} : ${questions} ${plural(questions, 'question', 'questions')}, barème ${scale}`,
  preview_scoring: ({ questionsPerStudent, maxRawScore, finalScale }) =>
    `${questionsPerStudent} ${plural(questionsPerStudent, 'question', 'questions')} par étudiant · note brute sur ${maxRawScore} → note finale sur ${finalScale}`,
  preview_rounding: roundingFr,
  preview_skips_disabled: () => 'Skips désactivés',
  preview_skips: ({ max }) => `Skips autorisés : ${max} par étudiant`,
  markdown_footnotes: () => 'Notes',
  markdown_footnote_back: ({ n }) => `Revenir à la référence ${n}`,
  passage_question_index: ({ current, total }) => `Question ${current} / ${total}`,
  passage_raw_score: ({ score }) => `Score brut : ${score}`,
  passage_categories: () => 'Choisir une catégorie',
  passage_category_max: ({ max }) => `max ${max}`,
  passage_category_exhausted: () => 'Plus de question disponible dans cette catégorie',
  passage_answer: () => 'Éléments de réponse',
  passage_score_heading: () => 'Note',
  passage_score_button: ({ value }) => `Noter ${value}`,
  passage_status_todo: () => 'à passer',
  passage_status_in_progress: () => 'en cours',
  passage_status_done: () => 'terminé',
  passage_status_absent: () => 'absent',
  passage_no_student_title: () => 'Aucun étudiant sélectionné',
  passage_no_student_body: () =>
    'Choisissez un étudiant dans l’onglet « Étudiants » du panneau pour commencer le passage.',
  passage_absent_title: () => 'Étudiant absent',
  passage_absent_body: () => 'Décochez « Absent » dans le panneau pour le faire passer.',
  passage_done_title: () => 'Passage terminé',
  final_scores_heading: () => 'Notes',
  final_detail_heading: () => 'Détail du passage',
  final_raw: () => 'Note brute',
  final_capped: () => 'Note plafonnée',
  final_converted: () => 'Note convertie',
  final_adjustment: () => 'Ajustement',
  final_final: () => 'Note finale',
  final_no_adjustment: () => 'aucun',
  final_score: ({ value, scale }) => `${value} / ${scale}`,
  final_points: ({ score, max }) => `${score} / ${max}`,
  final_skipped: () => 'Passée',
  final_skipped_reason: ({ reason }) => `Passée — ${reason}`,
  final_adjust: () => 'Ajuster',
  final_reset: () => 'Réinitialiser l’étudiant',
  final_next: () => 'Étudiant suivant',
  final_no_next: () => 'Tous les étudiants sont passés',
  attempt_pending: () => 'En cours',
  attempt_score_label: ({ rank }) => `Note de la question ${rank}`,
  attempt_out_of: ({ max }) => `/ ${max}`,
  score_not_computed: () => '—',
  side_panel_label: () => 'Panneau latéral',
  side_panel_open: () => 'Panneau',
  side_panel_close: () => 'Fermer le panneau',
  side_panel_show: () => 'Afficher le panneau',
  side_panel_tab_student: () => 'Étudiant',
  side_panel_tab_students: () => 'Étudiants',
  students_list_label: () => 'Étudiants de la session',
  students_projected: () => 'Projeté',
  projection_open: () => 'Ouvrir la vue projetée',
  projection_project: () => 'Projeter cet étudiant',
  projection_waiting: () => 'Écran d’attente',
  projection_preview_label: () => 'Vue projetée',
  projection_banner: ({ name }) => `La vue projetée montre ${name}.`,
  projection_popup_blocked: () =>
    'Autorisez les fenêtres pop-up pour ce site pour ouvrir la vue projetée.',
  students_row_scores: ({ raw, final }) => `${raw} · ${final}`,
  students_add: () => 'Ajouter un étudiant',
  students_add_title: () => 'Ajouter un étudiant',
  students_add_last_name: () => 'Nom',
  students_add_first_name: () => 'Prénom',
  students_add_submit: () => 'Ajouter',
  students_add_and_start: () => 'Ajouter et faire passer',
  students_add_duplicate: ({ name }) => `${name} est déjà dans la liste.`,
  student_tab_questions: () => 'Questions',
  student_tab_totals: () => 'Totaux',
  student_tab_no_student: () => 'Aucun étudiant sélectionné.',
  student_tab_no_attempts: () => 'Aucune question tirée.',
  comment_label: () => 'Commentaire',
  comment_saving: () => 'Enregistrement…',
  comment_saved: () => 'Enregistré',
  comment_error: () => 'Échec de l’enregistrement',
  absent_label: () => 'Absent',
  absent_title: ({ name }) => `Déclarer ${name} absent ?`,
  absent_body: ({ count }) =>
    `Ce passage contient ${count} ${plural(count, 'question tirée', 'questions tirées')}. Déclarer l’étudiant absent les supprime. Le commentaire est conservé.`,
  absent_confirm: () => 'Déclarer absent',
  reset_title: ({ name }) => `Réinitialiser ${name} ?`,
  reset_body: () =>
    'Les questions tirées, les notes et l’ajustement seront supprimés. Le commentaire est conservé.',
  reset_confirm: () => 'Réinitialiser',
  adjust_title: () => 'Ajuster la note',
  adjust_field: () => 'Ajustement',
  adjust_decrement: () => 'Retirer un pas',
  adjust_increment: () => 'Ajouter un pas',
  adjust_invalid: ({ step, max }) => `Saisissez un multiple de ${step}, entre −${max} et ${max}.`,
  adjust_preview: ({ converted, sign, adjustment, final, scale }) =>
    `${converted} ${sign} ${adjustment} = ${final} / ${scale}`,
  adjust_clamped: ({ bound }) => `(bornée à ${bound})`,
  adjust_reason: () => 'Justification (facultative)',
  passage_error_generic: () => 'L’action n’a pas pu être enregistrée. Rechargez la page.',
  passage_skip_button: ({ remaining }) =>
    `Passer la question (${remaining} ${plural(remaining, 'passe restante', 'passes restantes')})`,
  passage_skip_quota_reached: () => 'Plus de passe disponible pour cet étudiant.',
  passage_skip_title: () => 'Passer la question ?',
  passage_skip_body: () =>
    'La question sera exclue pour cet étudiant et ne comptera pas dans son passage. Un skip ne s’annule pas.',
  passage_skip_reasons: () => 'Motif (facultatif)',
  passage_skip_free_text: () => 'Autre motif',
  passage_skip_confirm: () => 'Passer',
  stats_open: () => 'Statistiques',
  export_button: () => 'Exporter en Excel',
  export_busy: () => 'Export en cours…',
  export_error: () => "L'export a échoué. Réessayez.",
  editor_title: () => 'Éditeur de config',
  editor_label: () => 'Configuration JSON',
  editor_source_title: () => 'Configuration',
  editor_preview_title: () => 'Aperçu',
  editor_load_file: () => 'Charger un fichier',
  editor_reset_example: () => "Repartir de l'exemple",
  editor_download: () => 'Télécharger',
  editor_create_session: () => 'Créer une session avec cette config',
  editor_issues_none: () => 'Aucune erreur',
  editor_issues_count: ({ errors, warnings }) =>
    `${errors} ${plural(errors, 'erreur', 'erreurs')}, ${warnings} ${plural(warnings, 'avertissement', 'avertissements')}`,
  editor_preview_stale: () => 'Aperçu périmé : la config contient des erreurs.',
  editor_preview_empty: () => "L'aperçu apparaîtra dès que la config sera valide.",
  editor_expected_answer: () => 'Réponse attendue',
  editor_final_screen: () => 'Écran final',
  stats_back: () => 'Retour au passage',
  stats_error: () => "Les statistiques n'ont pas pu être chargées.",
  stats_headcount: () => 'Effectifs',
  stats_headcount_total: () => 'Étudiants',
  stats_headcount_done: () => 'Terminés',
  stats_headcount_in_progress: () => 'En cours',
  stats_headcount_todo: () => 'À passer',
  stats_headcount_absent: () => 'Absents',
  stats_headcount_added: () => 'Ajoutés en séance',
  stats_grades: () => 'Notes finales',
  stats_grades_count: () => 'Étudiants notés',
  stats_grades_min: () => 'Minimum',
  stats_grades_max: () => 'Maximum',
  stats_grades_mean: () => 'Moyenne',
  stats_grades_median: () => 'Médiane',
  stats_grades_std_dev: () => 'Écart-type',
  stats_histogram: () => 'Histogramme',
  stats_histogram_empty: () => "Aucun étudiant n'a terminé.",
  stats_col_range: () => 'Intervalle de notes',
  stats_categories: () => 'Catégories',
  stats_tags: () => 'Tags',
  stats_tags_empty: () => "Aucune question n'a de tag.",
  stats_top_drawn: () => 'Questions les plus tirées',
  stats_top_drawn_empty: () => 'Aucune question tirée.',
  stats_skipped: () => 'Questions passées',
  stats_skipped_empty: () => 'Aucune question passée.',
  stats_strategies: () => 'Stratégies',
  stats_strategies_empty: () => "Aucun étudiant n'a terminé.",
  stats_adjustments: () => 'Ajustements',
  stats_adjustments_count: () => 'Nombre',
  stats_adjustments_sum: () => 'Somme',
  stats_adjustments_mean: () => 'Moyenne',
  stats_col_category: () => 'Catégorie',
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
  stats_times: ({ label, count }) => `${label} ×${count}`,
  stats_no_reason: () => 'sans motif',
}

const en: Dictionary<UiMessageParams> = {
  app_title: () => 'Questionator Z-4000 Hyperdrive',
  not_found_title: () => 'Page not found',
  back_home: () => 'Back to home',
  home_create: () => 'Create a session',
  home_import: () => 'Import a backup',
  home_actions_title: () => 'Actions',
  home_sessions_title: () => 'Sessions',
  home_create_title: () => 'New session',
  home_create_body: () =>
    'Start from a student list (CSV, last name / first name) and a configuration file (JSON: categories, questions, scales).',
  home_students_example_link: () => 'Download the example student list',
  home_config_example_link: () => 'Download the example config',
  home_config_schema_link: () => 'Config JSON Schema',
  home_import_title: () => 'Restore a session',
  home_import_body: () =>
    'Restore a session from a .json file made with “Export a backup”. You can also drop the file anywhere on the page.',
  persistence_warning_label: () => 'Storage not guaranteed',
  persistence_warning: () =>
    'The browser did not guarantee data retention: it may erase your sessions when space runs low. Export a backup regularly.',
  db_outdated: () => 'The app was updated in another tab. Reload the page to continue.',
  db_reload: () => 'Reload',
  db_unavailable: () =>
    'Local storage is unavailable (private browsing or blocked cookies?). Sessions cannot be saved.',
  update_available: () => 'New version available',
  update_reload: () => 'Reload',
  color_mode_label: ({ mode }) => `Display mode: ${mode.toLocaleLowerCase('en')}`,
  color_mode_light: () => 'Light',
  color_mode_dark: () => 'Dark',
  color_mode_system: () => 'System',
  session_loading: () => 'Loading session…',
  session_not_found: () => 'Session not found',
  present_waiting: () => 'The exam will start soon.',
  present_prompt_label: () => 'Current question',
  present_question_index: ({ current, total }) => `Question ${current} / ${total}`,
  present_cumulative: ({ score }) => `Score: ${score}`,
  present_finished: () => 'Exam complete',
  present_final: ({ value, scale }) => `Grade: ${value} / ${scale}`,
  present_raw: ({ value }) => `Raw score: ${value}`,
  present_category_exhausted: () => 'Exhausted',
  present_skipped: () => 'Skipped',
  present_fullscreen: () => 'Full screen',
  present_exit_fullscreen: () => 'Exit full screen',
  empty_title: () => 'No sessions yet',
  empty_body: () => 'Create a session or import a backup from the actions.',
  card_examiner: ({ name }) => `Examiner: ${name}`,
  card_updated: ({ date }) => `Updated ${date}`,
  card_progress: ({ done, absent, remaining }) =>
    `${done} done · ${absent} absent · ${remaining} remaining`,
  card_resume: () => 'Resume',
  card_actions: ({ name }) => `Actions for "${name}"`,
  action_rename: () => 'Rename',
  action_edit_examiner: () => 'Edit examiner',
  action_export: () => 'Export a backup',
  action_delete: () => 'Delete',
  rename_title: () => 'Rename session',
  rename_label: () => 'Session name',
  examiner_title: () => 'Edit examiner',
  examiner_label: () => 'Examiner name',
  examiner_hint: () => 'Optional. Included as a column in exports.',
  dialog_save: () => 'Save',
  dialog_cancel: () => 'Cancel',
  dialog_close: () => 'Close',
  write_error: () => 'Saving failed. The session may have been deleted in another tab.',
  delete_title: ({ name }) => `Delete "${name}"?`,
  delete_body: () => 'This cannot be undone: all attempts in this session will be lost.',
  delete_export_first: () => 'Export a backup first',
  delete_confirm: () => 'Delete',
  import_drop_hint: () => 'Drop the backup here',
  import_error_title: ({ fileName }) => `Cannot import ${fileName}`,
  import_read_error: () => 'The file could not be read.',
  import_load_error: () => 'The import could not start. Reload the page and try again.',
  import_conflict_title: () => 'Session already exists',
  import_conflict_body: ({ existing, date, imported }) =>
    `A session "${existing}" (updated ${date}) has the same identifier. Replace it with "${imported}"?`,
  import_replace: () => 'Replace',
  create_title: () => 'New session',
  create_students_label: () => 'Student list (CSV)',
  create_config_label: () => 'Configuration (JSON)',
  create_choose_file: () => 'Choose a file',
  create_replace_file: () => 'Replace',
  create_drop_hint: () => 'or drop it here',
  create_file_status_ok: () => 'Valid file',
  create_file_status_warnings: () => 'Valid file, with warnings',
  create_file_status_errors: () => 'Invalid file',
  create_file_status_reading: () => 'Reading…',
  create_students_example_link: () => 'Download the example list',
  create_config_example_link: () => 'Download the example config',
  create_validator_load_error: () => 'Validation could not start. Reload the page.',
  create_submit: () => 'Create session',
  create_write_error: () => 'Creation failed. Please try again.',
  create_preview_title: () => 'Preview',
  create_preview_empty: () => 'Drop a student list and a configuration to see the preview.',
  preview_students_count: ({ count }) => `${count} ${pluralEn(count, 'student', 'students')}`,
  preview_students_list: () => 'Show the list',
  preview_line: ({ line, message }) => `Line ${line}: ${message}`,
  preview_config_title: () => 'Configuration',
  preview_subject: ({ subject }) => `Subject: ${subject}`,
  preview_cohort: ({ cohort }) => `Cohort: ${cohort}`,
  preview_category: ({ label, questions, scale }) =>
    `${label}: ${questions} ${pluralEn(questions, 'question', 'questions')}, scale ${scale}`,
  preview_scoring: ({ questionsPerStudent, maxRawScore, finalScale }) =>
    `${questionsPerStudent} ${pluralEn(questionsPerStudent, 'question', 'questions')} per student · raw score out of ${maxRawScore} → final score out of ${finalScale}`,
  preview_rounding: roundingEn,
  preview_skips_disabled: () => 'Skips disabled',
  preview_skips: ({ max }) => `Skips allowed: ${max} per student`,
  markdown_footnotes: () => 'Footnotes',
  markdown_footnote_back: ({ n }) => `Back to reference ${n}`,
  passage_question_index: ({ current, total }) => `Question ${current} / ${total}`,
  passage_raw_score: ({ score }) => `Raw score: ${score}`,
  passage_categories: () => 'Choose a category',
  passage_category_max: ({ max }) => `max ${max}`,
  passage_category_exhausted: () => 'No questions left in this category',
  passage_answer: () => 'Answer notes',
  passage_score_heading: () => 'Score',
  passage_score_button: ({ value }) => `Score ${value}`,
  passage_status_todo: () => 'to do',
  passage_status_in_progress: () => 'in progress',
  passage_status_done: () => 'done',
  passage_status_absent: () => 'absent',
  passage_no_student_title: () => 'No student selected',
  passage_no_student_body: () => 'Pick a student in the panel’s “Students” tab to start.',
  passage_absent_title: () => 'Student absent',
  passage_absent_body: () => 'Uncheck “Absent” in the panel to examine them.',
  passage_done_title: () => 'Exam complete',
  final_scores_heading: () => 'Scores',
  final_detail_heading: () => 'Exam breakdown',
  final_raw: () => 'Raw score',
  final_capped: () => 'Capped score',
  final_converted: () => 'Converted score',
  final_adjustment: () => 'Adjustment',
  final_final: () => 'Final score',
  final_no_adjustment: () => 'none',
  final_score: ({ value, scale }) => `${value} / ${scale}`,
  final_points: ({ score, max }) => `${score} / ${max}`,
  final_skipped: () => 'Skipped',
  final_skipped_reason: ({ reason }) => `Skipped — ${reason}`,
  final_adjust: () => 'Adjust',
  final_reset: () => 'Reset student',
  final_next: () => 'Next student',
  final_no_next: () => 'All students have been examined',
  attempt_pending: () => 'In progress',
  attempt_score_label: ({ rank }) => `Score for question ${rank}`,
  attempt_out_of: ({ max }) => `/ ${max}`,
  score_not_computed: () => '—',
  side_panel_label: () => 'Side panel',
  side_panel_open: () => 'Panel',
  side_panel_close: () => 'Close the panel',
  side_panel_show: () => 'Show panel',
  side_panel_tab_student: () => 'Student',
  side_panel_tab_students: () => 'Students',
  students_list_label: () => 'Session students',
  students_projected: () => 'Projected',
  projection_open: () => 'Open the projected view',
  projection_project: () => 'Project this student',
  projection_waiting: () => 'Waiting screen',
  projection_preview_label: () => 'Projected view',
  projection_banner: ({ name }) => `The projected view shows ${name}.`,
  projection_popup_blocked: () => 'Allow pop-ups for this site to open the projected view.',
  students_row_scores: ({ raw, final }) => `${raw} · ${final}`,
  students_add: () => 'Add a student',
  students_add_title: () => 'Add a student',
  students_add_last_name: () => 'Last name',
  students_add_first_name: () => 'First name',
  students_add_submit: () => 'Add',
  students_add_and_start: () => 'Add and start',
  students_add_duplicate: ({ name }) => `${name} is already in the list.`,
  student_tab_questions: () => 'Questions',
  student_tab_totals: () => 'Totals',
  student_tab_no_student: () => 'No student selected.',
  student_tab_no_attempts: () => 'No question drawn.',
  comment_label: () => 'Comment',
  comment_saving: () => 'Saving…',
  comment_saved: () => 'Saved',
  comment_error: () => 'Saving failed',
  absent_label: () => 'Absent',
  absent_title: ({ name }) => `Mark ${name} as absent?`,
  absent_body: ({ count }) =>
    `This exam has ${count} ${pluralEn(count, 'drawn question', 'drawn questions')}. Marking the student absent deletes them. The comment is kept.`,
  absent_confirm: () => 'Mark absent',
  reset_title: ({ name }) => `Reset ${name}?`,
  reset_body: () =>
    'Drawn questions, scores and the adjustment will be deleted. The comment is kept.',
  reset_confirm: () => 'Reset',
  adjust_title: () => 'Adjust the score',
  adjust_field: () => 'Adjustment',
  adjust_decrement: () => 'Remove one step',
  adjust_increment: () => 'Add one step',
  adjust_invalid: ({ step, max }) => `Enter a multiple of ${step}, between −${max} and ${max}.`,
  adjust_preview: ({ converted, sign, adjustment, final, scale }) =>
    `${converted} ${sign} ${adjustment} = ${final} / ${scale}`,
  adjust_clamped: ({ bound }) => `(capped at ${bound})`,
  adjust_reason: () => 'Justification (optional)',
  passage_error_generic: () => 'The action could not be saved. Reload the page.',
  passage_skip_button: ({ remaining }) =>
    `Skip question (${remaining} ${pluralEn(remaining, 'skip', 'skips')} left)`,
  passage_skip_quota_reached: () => 'No skips left for this student.',
  passage_skip_title: () => 'Skip this question?',
  passage_skip_body: () =>
    'The question will be excluded for this student and will not count towards their exam. A skip cannot be undone.',
  passage_skip_reasons: () => 'Reason (optional)',
  passage_skip_free_text: () => 'Other reason',
  passage_skip_confirm: () => 'Skip',
  stats_open: () => 'Statistics',
  export_button: () => 'Export to Excel',
  export_busy: () => 'Exporting…',
  export_error: () => 'Export failed. Try again.',
  editor_title: () => 'Config editor',
  editor_label: () => 'JSON configuration',
  editor_source_title: () => 'Configuration',
  editor_preview_title: () => 'Preview',
  editor_load_file: () => 'Load a file',
  editor_reset_example: () => 'Start from the example',
  editor_download: () => 'Download',
  editor_create_session: () => 'Create a session with this config',
  editor_issues_none: () => 'No errors',
  editor_issues_count: ({ errors, warnings }) =>
    `${errors} ${pluralEn(errors, 'error', 'errors')}, ${warnings} ${pluralEn(warnings, 'warning', 'warnings')}`,
  editor_preview_stale: () => 'Preview out of date: the config contains errors.',
  editor_preview_empty: () => 'The preview will appear once the config is valid.',
  editor_expected_answer: () => 'Expected answer',
  editor_final_screen: () => 'Final screen',
  stats_back: () => 'Back to the exam',
  stats_error: () => 'The statistics could not be loaded.',
  stats_headcount: () => 'Headcount',
  stats_headcount_total: () => 'Students',
  stats_headcount_done: () => 'Finished',
  stats_headcount_in_progress: () => 'In progress',
  stats_headcount_todo: () => 'Not started',
  stats_headcount_absent: () => 'Absent',
  stats_headcount_added: () => 'Added during the session',
  stats_grades: () => 'Final scores',
  stats_grades_count: () => 'Scored students',
  stats_grades_min: () => 'Minimum',
  stats_grades_max: () => 'Maximum',
  stats_grades_mean: () => 'Mean',
  stats_grades_median: () => 'Median',
  stats_grades_std_dev: () => 'Standard deviation',
  stats_histogram: () => 'Histogram',
  stats_histogram_empty: () => 'No student has finished.',
  stats_col_range: () => 'Score range',
  stats_categories: () => 'Categories',
  stats_tags: () => 'Tags',
  stats_tags_empty: () => 'No question has a tag.',
  stats_top_drawn: () => 'Most drawn questions',
  stats_top_drawn_empty: () => 'No question drawn.',
  stats_skipped: () => 'Skipped questions',
  stats_skipped_empty: () => 'No question skipped.',
  stats_strategies: () => 'Strategies',
  stats_strategies_empty: () => 'No student has finished.',
  stats_adjustments: () => 'Adjustments',
  stats_adjustments_count: () => 'Count',
  stats_adjustments_sum: () => 'Sum',
  stats_adjustments_mean: () => 'Mean',
  stats_col_category: () => 'Category',
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
  stats_times: ({ label, count }) => `${label} ×${count}`,
  stats_no_reason: () => 'no reason',
}

export const UI_MESSAGES: Record<Locale, Dictionary<UiMessageParams>> = { fr, en }
