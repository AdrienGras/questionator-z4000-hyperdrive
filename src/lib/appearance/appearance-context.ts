import { createContext, useContext, useId, useLayoutEffect } from 'react'
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
  /** Ajoute une entrée sans portée en fin de pile ; renvoie le retrait. */
  register: (id: string) => () => void
  /** Remplace le contenu de l'entrée `id` À LA MÊME position (ne la déplace pas dans la pile). */
  update: (id: string, scope: AppearanceScope) => void
}

export const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function useAppearanceContext(): AppearanceContextValue {
  const value = useContext(AppearanceContext)
  if (value === null) throw new Error('AppearanceProvider manquant autour de ce composant.')
  return value
}

/**
 * Déclare `scope` tant que le composant est monté. Garde sa place dans la pile même re-mémoïsé
 * (un nouvel objet à chaque rendu ne la fait pas passer en fin de pile) ; mémoïser `scope` reste
 * recommandé pour éviter de réécrire les tokens à chaque rendu.
 */
export function useAppearanceScope(scope: AppearanceScope): void {
  const { register, update } = useAppearanceContext()
  const id = useId()
  // Le register doit précéder l'update au montage : deux effets séparés, dans cet ordre.
  useLayoutEffect(() => register(id), [register, id])
  useLayoutEffect(() => update(id, scope), [update, id, scope])
}

export function useColorModeControl(): Pick<
  AppearanceContextValue,
  'mode' | 'effective' | 'setMode'
> {
  const { mode, effective, setMode } = useAppearanceContext()
  return { mode, effective, setMode }
}
