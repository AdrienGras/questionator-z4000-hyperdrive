import { createContext, useContext, useLayoutEffect } from 'react'
import { colorModeKey, type ColorMode, type EffectiveMode } from './color-mode'

/** Surcharges de tokens shadcn d'un mode : nom sans `--` → valeur CSS (D15). */
export type ThemeTokens = Readonly<Record<string, string | undefined>>

/** Ce qu'un écran demande à l'apparence : clé de mémorisation, mode par défaut, thème éventuel. */
export type AppearanceScope = Readonly<{
  key: string
  defaultMode: ColorMode
  theme?: { light: ThemeTokens; dark: ThemeTokens }
}>

/** Accueil, création : thème shadcn par défaut, mode du système, choix mémorisé globalement (D60). */
export const GLOBAL_SCOPE: AppearanceScope = { key: colorModeKey('global'), defaultMode: 'system' }

export type AppearanceContextValue = {
  mode: ColorMode
  effective: EffectiveMode
  setMode: (mode: ColorMode) => void
  declareScope: (scope: AppearanceScope) => () => void
}

export const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function useAppearanceContext(): AppearanceContextValue {
  const value = useContext(AppearanceContext)
  if (value === null) throw new Error('AppearanceProvider manquant autour de ce composant.')
  return value
}

/** Déclare `scope` tant que le composant est monté. `scope` doit être mémoïsé (`useMemo`). */
export function useAppearanceScope(scope: AppearanceScope): void {
  const { declareScope } = useAppearanceContext()
  useLayoutEffect(() => declareScope(scope), [declareScope, scope])
}

export function useColorModeControl(): Pick<
  AppearanceContextValue,
  'mode' | 'effective' | 'setMode'
> {
  const { mode, effective, setMode } = useAppearanceContext()
  return { mode, effective, setMode }
}
