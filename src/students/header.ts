/** Comparaison d'en-têtes (D25) : NFD sans diacritiques, minuscules, sans espaces, tirets ni underscores. */
export function normalizeHeaderCell(cell: string): string {
  return cell
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[\s_-]/g, '')
}

const LAST_NAME = new Set(['nom', 'nomdefamille', 'lastname', 'surname', 'familyname'])
const FIRST_NAME = new Set(['prenom', 'firstname', 'givenname'])

export function classifyHeaderCell(cell: string): 'lastName' | 'firstName' | undefined {
  const normalized = normalizeHeaderCell(cell)
  if (LAST_NAME.has(normalized)) return 'lastName'
  if (FIRST_NAME.has(normalized)) return 'firstName'
  return undefined
}
