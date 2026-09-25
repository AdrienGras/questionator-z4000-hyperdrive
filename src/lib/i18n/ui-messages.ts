import type { Dictionary, Locale } from './i18n'

type NoParams = Record<string, never>

export type UiMessageParams = {
  app_title: NoParams
  not_found_title: NoParams
  back_home: NoParams
  coming_soon_title: NoParams
  coming_soon_body: NoParams
  home_create: NoParams
  home_import: NoParams
  persistence_warning_label: NoParams
  persistence_warning: NoParams
  db_outdated: NoParams
  db_reload: NoParams
  db_unavailable: NoParams
  color_mode_label: { mode: string }
  color_mode_light: NoParams
  color_mode_dark: NoParams
  color_mode_system: NoParams
  session_loading: NoParams
  session_not_found: NoParams
  session_categories: NoParams
  present_waiting: NoParams
  empty_title: NoParams
  empty_body: NoParams
  empty_example_link: NoParams
  empty_students_example_link: NoParams
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
  coming_soon_title: () => 'Bientôt disponible',
  coming_soon_body: () => "Cet écran arrive dans une prochaine version de l'application.",
  home_create: () => 'Créer une session',
  home_import: () => 'Importer un backup',
  persistence_warning_label: () => 'Stockage non garanti',
  persistence_warning: () =>
    "Le navigateur n'a pas garanti la conservation des données : il peut effacer vos sessions s'il manque d'espace. Exportez régulièrement un backup.",
  db_outdated: () =>
    "L'application a été mise à jour dans un autre onglet. Rechargez la page pour continuer.",
  db_reload: () => 'Recharger',
  db_unavailable: () =>
    'Le stockage local est indisponible (navigation privée ou cookies bloqués ?). Les sessions ne peuvent pas être enregistrées.',
  color_mode_label: ({ mode }) => `Mode d'affichage : ${mode}`,
  color_mode_light: () => 'Clair',
  color_mode_dark: () => 'Sombre',
  color_mode_system: () => 'Système',
  session_loading: () => 'Chargement de la session…',
  session_not_found: () => 'Session introuvable',
  session_categories: () => 'Catégories',
  present_waiting: () => "L'épreuve va bientôt commencer.",
  empty_title: () => 'Aucune session',
  empty_body: () =>
    "Créez une session à partir d'une liste d'étudiants et d'un fichier de configuration, ou importez un backup.",
  empty_example_link: () => "Télécharger la config d'exemple",
  empty_students_example_link: () => "Télécharger la liste d'étudiants d'exemple",
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
}

const en: Dictionary<UiMessageParams> = {
  app_title: () => 'Questionator Z-4000 Hyperdrive',
  not_found_title: () => 'Page not found',
  back_home: () => 'Back to home',
  coming_soon_title: () => 'Coming soon',
  coming_soon_body: () => 'This screen is coming in a future version of the app.',
  home_create: () => 'Create a session',
  home_import: () => 'Import a backup',
  persistence_warning_label: () => 'Storage not guaranteed',
  persistence_warning: () =>
    'The browser did not guarantee data retention: it may erase your sessions when space runs low. Export a backup regularly.',
  db_outdated: () => 'The app was updated in another tab. Reload the page to continue.',
  db_reload: () => 'Reload',
  db_unavailable: () =>
    'Local storage is unavailable (private browsing or blocked cookies?). Sessions cannot be saved.',
  color_mode_label: ({ mode }) => `Display mode: ${mode}`,
  color_mode_light: () => 'Light',
  color_mode_dark: () => 'Dark',
  color_mode_system: () => 'System',
  session_loading: () => 'Loading session…',
  session_not_found: () => 'Session not found',
  session_categories: () => 'Categories',
  present_waiting: () => 'The exam will start soon.',
  empty_title: () => 'No sessions yet',
  empty_body: () =>
    'Create a session from a student list and a configuration file, or import a backup.',
  empty_example_link: () => 'Download the example config',
  empty_students_example_link: () => 'Download the example student list',
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
}

export const UI_MESSAGES: Record<Locale, Dictionary<UiMessageParams>> = { fr, en }
