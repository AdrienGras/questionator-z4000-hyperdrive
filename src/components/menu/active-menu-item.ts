/** Entrées du menu latéral (D102, D103) : l'accueil, puis les trois espaces. */
export type MenuItemId = 'home' | 'sessions' | 'editor' | 'training'

/** Premier segment de chemin → espace du menu : le lien actif couvre les sous-écrans de l'espace. */
const SPACE_BY_SEGMENT: Readonly<Record<string, MenuItemId>> = {
  sessions: 'sessions',
  new: 'sessions',
  session: 'sessions',
  editor: 'editor',
  trainings: 'training',
  training: 'training',
}

/** Lien actif du menu pour `pathname` ; `undefined` hors de toute entrée (404). */
export function activeMenuItem(pathname: string): MenuItemId | undefined {
  const segment = pathname.split('/').find((part) => part !== '') ?? ''
  if (segment === '') return 'home'
  return Object.hasOwn(SPACE_BY_SEGMENT, segment) ? SPACE_BY_SEGMENT[segment] : undefined
}
