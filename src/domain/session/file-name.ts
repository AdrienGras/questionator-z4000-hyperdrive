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

/**
 * Slug ASCII d'un nom pour un nom de fichier (60 caractères max), `fallback` (`session` par défaut)
 * quand le nom ne garde aucun caractère.
 */
export function slugify(name: string, fallback: string = FALLBACK_SLUG): string {
  const collapsed = trimEdgeDash(
    name
      .normalize('NFD')
      .replaceAll(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-'),
  )
  // La troncature peut faire retomber un tiret interne en position de queue : on le retire aussi.
  const slug = trimEdgeDash(collapsed.slice(0, SLUG_MAX_LENGTH))
  return slug === '' ? fallback : slug
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Date locale `AAAA-MM-JJ` (heure murale de l'examinateur, pas UTC). */
export function localDateStamp(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
