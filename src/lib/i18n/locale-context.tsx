import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { detectBrowserLocale, readNavigatorLanguages } from './browser-locale'
import type { Locale } from './i18n'

type LocaleContextValue = Readonly<{
  locale: Locale
  /** Déclare une locale auprès du propriétaire ; retourne la fonction de retrait. */
  declare: (locale: Locale) => () => void
}>

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

/**
 * Racine de la portée de langue (sans `LocaleProvider` parent) : seule à écrire `lang` sur
 * `<html>`, à partir de la dernière locale déclarée par ses descendants (sinon sa propre prop).
 */
function OwnerLocaleProvider({
  locale,
  children,
}: Readonly<{ locale: Locale; children: ReactNode }>) {
  const [stack, setStack] = useState<ReadonlyArray<Readonly<{ locale: Locale }>>>([])

  const declare = useCallback((declaredLocale: Locale) => {
    const entry = { locale: declaredLocale }
    setStack((prev) => [...prev, entry])
    return () => {
      setStack((prev) => prev.filter((candidate) => candidate !== entry))
    }
  }, [])

  const lastDeclared = stack.at(-1)
  const effective = lastDeclared ? lastDeclared.locale : locale

  useLayoutEffect(() => {
    const root = document.documentElement
    const previous = root.lang
    root.lang = effective
    return () => {
      root.lang = previous
    }
  }, [effective])

  const value = useMemo<LocaleContextValue>(() => ({ locale, declare }), [locale, declare])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/**
 * Portée de langue imbriquée : n'écrit jamais `lang`, se déclare auprès du propriétaire et
 * transmet à ses enfants sa propre locale avec le `declare` du propriétaire.
 */
function NestedLocaleProvider({
  locale,
  parent,
  children,
}: Readonly<{ locale: Locale; parent: LocaleContextValue; children: ReactNode }>) {
  const { declare } = parent

  useLayoutEffect(() => declare(locale), [declare, locale])

  const value = useMemo<LocaleContextValue>(() => ({ locale, declare }), [locale, declare])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/** Fixe la langue de l'interface pour ses enfants et `lang` sur `<html>` (rétabli au démontage). */
export function LocaleProvider({
  locale,
  children,
}: Readonly<{ locale: Locale; children: ReactNode }>) {
  const parent = useContext(LocaleContext)
  if (parent) {
    return (
      <NestedLocaleProvider locale={locale} parent={parent}>
        {children}
      </NestedLocaleProvider>
    )
  }
  return <OwnerLocaleProvider locale={locale}>{children}</OwnerLocaleProvider>
}

/** Langue du provider le plus proche ; hors provider, celle du navigateur (D51). */
export function useLocale(): Locale {
  const context = useContext(LocaleContext)
  const browser = useMemo(() => detectBrowserLocale(readNavigatorLanguages()), [])
  return context?.locale ?? browser
}

/** Langue d'une vue de session : `config.locale`, sinon navigateur, sinon `fr` (D26). */
export function resolveSessionLocale(
  configLocale: Locale | undefined,
  languages: readonly string[] = readNavigatorLanguages(),
): Locale {
  return configLocale ?? detectBrowserLocale(languages)
}
