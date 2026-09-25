import { useCallback } from 'react'
import { t, type Locale } from './i18n'
import { useLocale } from './locale-context'
import { UI_MESSAGES, type UiMessageParams } from './ui-messages'

/** Dictionnaire d'interface dans la langue du `LocaleProvider` le plus proche (navigateur hors session, config en session). */
export function useUi(): {
  locale: Locale
  text: <K extends keyof UiMessageParams>(key: K, params: UiMessageParams[K]) => string
} {
  const locale = useLocale()
  const text = useCallback(
    <K extends keyof UiMessageParams>(key: K, params: UiMessageParams[K]) =>
      t(UI_MESSAGES, locale, key, params),
    [locale],
  )
  return { locale, text }
}

export type Ui = ReturnType<typeof useUi>
