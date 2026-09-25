import { useCallback, useMemo } from 'react'
import { t, type Locale } from './index'
import { detectBrowserLocale, readNavigatorLanguages } from './browser-locale'
import { UI_MESSAGES, type UiMessageParams } from './ui-messages'

/** Langue du navigateur (accueil, création : pas de config chargée, D51) et accès au dictionnaire. */
export function useUi(): {
  locale: Locale
  text: <K extends keyof UiMessageParams>(key: K, params: UiMessageParams[K]) => string
} {
  const locale = useMemo(() => detectBrowserLocale(readNavigatorLanguages()), [])
  const text = useCallback(
    <K extends keyof UiMessageParams>(key: K, params: UiMessageParams[K]) =>
      t(UI_MESSAGES, locale, key, params),
    [locale],
  )
  return { locale, text }
}

export type Ui = ReturnType<typeof useUi>
