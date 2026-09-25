import { iconsList } from '@tabler/icons-react'

/** Noms kebab-case des icônes Tabler : le tableau seul, sans les composants (D37). */
export const ICON_NAMES: readonly string[] = iconsList.default

export const ICON_NAME_SET: ReadonlySet<string> = new Set(ICON_NAMES)
