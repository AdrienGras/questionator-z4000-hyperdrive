import type { ThemeTokens } from '@/lib/appearance/appearance-context'

/** Tokens d'un thème → variables CSS (`token` → `--token`) ; les valeurs `undefined` sont ignorées. */
export function themeVariables(tokens: ThemeTokens): Record<`--${string}`, string> {
  const variables: Record<`--${string}`, string> = {}
  for (const [token, value] of Object.entries(tokens)) {
    if (value !== undefined) variables[`--${token}`] = value
  }
  return variables
}
