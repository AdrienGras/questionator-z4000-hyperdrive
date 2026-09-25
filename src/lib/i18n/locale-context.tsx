import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { detectBrowserLocale, readNavigatorLanguages } from './browser-locale'
import type { Locale } from './i18n'

const LocaleContext = createContext<Locale | null>(null)
const ProviderDepthContext = createContext<number>(0)

// Stack to track active providers and ensure only the deepest updates lang
const providerStack: Array<{ id: symbol; locale: Locale; depth: number }> = []

/** Fixe la langue de l'interface pour ses enfants et `lang` sur `<html>` (rétabli au démontage). */
export function LocaleProvider({
  locale,
  children,
}: Readonly<{ locale: Locale; children: ReactNode }>) {
  const parentDepth = useContext(ProviderDepthContext)
  const myDepth = parentDepth + 1
  const providerIdRef = useRef(Symbol('locale-provider'))
  const prevLangRef = useRef('')

  useLayoutEffect(() => {
    const root = document.documentElement
    prevLangRef.current = root.lang

    // Register this provider
    providerStack.push({ id: providerIdRef.current, locale, depth: myDepth })

    // Only the deepest provider (highest depth) updates lang
    const deepest = providerStack.reduce(
      (max, p) => (p.depth > max.depth ? p : max),
      providerStack[0],
    )
    if (deepest.id === providerIdRef.current) {
      root.lang = locale
    }

    return () => {
      // Unregister by removing from stack
      const index = providerStack.findIndex((p) => p.id === providerIdRef.current)
      if (index !== -1) {
        providerStack.splice(index, 1)
      }
      // Restore previous value
      root.lang = prevLangRef.current
    }
  }, [locale, myDepth])
  return (
    <LocaleContext.Provider value={locale}>
      <ProviderDepthContext.Provider value={myDepth}>{children}</ProviderDepthContext.Provider>
    </LocaleContext.Provider>
  )
}

/** Langue du provider le plus proche ; hors provider, celle du navigateur (D51). */
export function useLocale(): Locale {
  const provided = useContext(LocaleContext)
  const browser = useMemo(() => detectBrowserLocale(readNavigatorLanguages()), [])
  return provided ?? browser
}

/** Langue d'une vue de session : `config.locale`, sinon navigateur, sinon `fr` (D26). */
export function resolveSessionLocale(
  configLocale: Locale | undefined,
  languages: readonly string[] = readNavigatorLanguages(),
): Locale {
  return configLocale ?? detectBrowserLocale(languages)
}
