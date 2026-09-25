import type { Dictionary, Locale } from './index'

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
  empty_title: NoParams
  empty_body: NoParams
  empty_example_link: NoParams
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
}

const plural = (count: number, one: string, many: string) => (count > 1 ? many : one)

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
  empty_title: () => 'Aucune session',
  empty_body: () =>
    "Créez une session à partir d'une liste d'étudiants et d'un fichier de configuration, ou importez un backup.",
  empty_example_link: () => "Télécharger la config d'exemple",
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
  empty_title: () => 'No sessions yet',
  empty_body: () =>
    'Create a session from a student list and a configuration file, or import a backup.',
  empty_example_link: () => 'Download the example config',
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
}

export const UI_MESSAGES: Record<Locale, Dictionary<UiMessageParams>> = { fr, en }
