import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  AppearanceContext,
  GLOBAL_SCOPE,
  type AppearanceContextValue,
  type AppearanceScope,
  type ThemeTokens,
} from '@/lib/appearance/appearance-context'
import {
  readStoredMode,
  resolveColorMode,
  writeStoredMode,
  type ColorMode,
  type EffectiveMode,
} from '@/lib/appearance/color-mode'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeToSystem(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches
}

/** Seul écrivain sur `<html>` : classe `.dark`, puis tokens du mode effectif via `setProperty` (D15). */
function useApplyAppearance(effective: EffectiveMode, tokens: ThemeTokens | undefined): void {
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', effective === 'dark')
    const applied: string[] = []
    for (const [token, value] of Object.entries(tokens ?? {})) {
      if (value === undefined) continue
      const name = `--${token}`
      root.style.setProperty(name, value)
      applied.push(name)
    }
    return () => {
      for (const name of applied) root.style.removeProperty(name)
      root.classList.remove('dark')
    }
  }, [effective, tokens])
}

/** Apparence de l'app (D60) : la dernière portée déclarée s'applique, sinon la portée globale. */
export function AppearanceProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [scopes, setScopes] = useState<readonly AppearanceScope[]>([])
  // Choix faits dans cette fenêtre : valent même si `localStorage` est inaccessible.
  const [choices, setChoices] = useState<Readonly<Record<string, ColorMode>>>({})
  const scope = scopes.at(-1) ?? GLOBAL_SCOPE
  const stored = choices[scope.key] ?? readStoredMode(scope.key)
  const systemDark = useSyncExternalStore(subscribeToSystem, systemPrefersDark)
  const effective = resolveColorMode(stored, scope.defaultMode, systemDark)

  const setMode = useCallback(
    (mode: ColorMode) => {
      setChoices((previous) => ({ ...previous, [scope.key]: mode }))
      writeStoredMode(scope.key, mode)
    },
    [scope.key],
  )
  const declareScope = useCallback((declared: AppearanceScope) => {
    setScopes((previous) => [...previous, declared])
    return () => setScopes((previous) => previous.filter((item) => item !== declared))
  }, [])

  useApplyAppearance(effective, scope.theme?.[effective])

  const value = useMemo<AppearanceContextValue>(
    () => ({ mode: stored ?? scope.defaultMode, effective, setMode, declareScope }),
    [stored, scope.defaultMode, effective, setMode, declareScope],
  )
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}
