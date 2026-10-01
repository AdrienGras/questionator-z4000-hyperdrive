import type { ReactNode } from 'react'

import type { NormalizedConfig } from '@/domain/config/normalize'
import { useColorModeControl } from '@/lib/appearance/appearance-context'
import { themeVariables } from '@/lib/appearance/theme-variables'

type ThemeScopeProps = Readonly<{
  theme: NormalizedConfig['theme']
  className?: string
  children: ReactNode
}>

/** Applique le thème d'une config (mode effectif courant) à ce seul sous-arbre, sans toucher `<html>`. */
export function ThemeScope({ theme, className, children }: ThemeScopeProps) {
  const { effective } = useColorModeControl()
  return (
    <div className={className} style={themeVariables(theme[effective])}>
      {children}
    </div>
  )
}
