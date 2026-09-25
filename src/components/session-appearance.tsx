import { useMemo, type ReactNode } from 'react'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { colorModeKey, type ColorModeView } from '@/lib/appearance/color-mode'
import { useAppearanceScope, type AppearanceScope } from '@/lib/appearance/appearance-context'
import { LocaleProvider, resolveSessionLocale } from '@/lib/i18n/locale-context'

type SessionAppearanceProps = Readonly<{
  sessionId: string
  view: ColorModeView
  config: NormalizedConfig
  children: ReactNode
}>

/**
 * Thème, mode et langue d'une vue de session (F07, D26, D60). Les enfants appellent `useUi()`
 * eux-mêmes : un `useUi()` au-dessus de ce composant ignorerait `config.locale`.
 */
export function SessionAppearance({ sessionId, view, config, children }: SessionAppearanceProps) {
  const { defaultColorMode } = config.presentation
  const { theme } = config
  const scope = useMemo<AppearanceScope>(
    () => ({ key: colorModeKey({ sessionId, view }), defaultMode: defaultColorMode, theme }),
    [sessionId, view, defaultColorMode, theme],
  )
  useAppearanceScope(scope)
  return <LocaleProvider locale={resolveSessionLocale(config.locale)}>{children}</LocaleProvider>
}
