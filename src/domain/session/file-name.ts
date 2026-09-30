const SLUG_MAX_LENGTH = 60

/** Repli quand le nom ne contient aucun caractère alphanumérique. */
const FALLBACK_SLUG = 'session'

/**
 * Retire au plus un tiret de tête et un de queue, sans regex ancrée en fin (signalée
 * super-linéaire par SonarQube, voir QUIRKS) : après le `replaceAll` de `slugify`, les tirets
 * consécutifs sont déjà réduits à un seul, donc `startsWith`/`endsWith` + `slice` suffisent.
 */
function trimEdgeDash(value: string): string {
  const withoutLeading = value.startsWith('-') ? value.slice(1) : value
  return withoutLeading.endsWith('-') ? withoutLeading.slice(0, -1) : withoutLeading
}

/** Slug ASCII d'un nom de session pour un nom de fichier (60 caractères max, repli `session`). */
export function slugify(name: string): string {
  const collapsed = trimEdgeDash(
    name
      .normalize('NFD')
      .replaceAll(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-'),
  )
  // La troncature peut faire retomber un tiret interne en position de queue : on le retire aussi.
  const slug = trimEdgeDash(collapsed.slice(0, SLUG_MAX_LENGTH))
  return slug === '' ? FALLBACK_SLUG : slug
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Date locale `AAAA-MM-JJ` (heure murale de l'examinateur, pas UTC). */
export function localDateStamp(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
