function fold(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Clé de doublon : sans diacritiques, sans casse. Ne trime pas : l'appelant s'en charge. */
export function identityKey(lastName: string, firstName: string): string {
  return `${fold(lastName)}\u0000${fold(firstName)}`
}
