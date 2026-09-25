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
  import_conflict_title: {},
  import_conflict_body: { existing: 'Ada', date: '01/01/2026', imported: 'Bob' },
  import_replace: {},
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
})
