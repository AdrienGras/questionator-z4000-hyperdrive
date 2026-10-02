/**
 * Vérifie que tout fichier émis dans `dist/` figure dans le manifeste de pré-cache de `dist/sw.js`.
 * Sans ce contrôle, un chunk dépassant `maximumFileSizeToCacheInBytes` (ex. le chunk Tabler) serait
 * silencieusement exclu du pré-cache et l'application ne fonctionnerait plus hors ligne (F17).
 * Inversement, la documentation VitePress (`dist/docs/`, F27, D96) ne doit jamais figurer dans le
 * pré-cache : le contrôle échoue si une entrée du manifeste commence par `docs/`.
 * Lancé par `pnpm check:precache` après `pnpm build`.
 * Exécuté par Node natif (types retirés) : imports avec extension `.ts`, syntaxe effaçable.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Entrées du manifeste minifié : `{url:"…",revision:…}` ou `{revision:…,url:"…"}`. */
const URL_PATTERN = /[{,]url:(["'])(.*?)\1/g

/** Les `url` du manifeste de pré-cache d'un service worker généré par Workbox. */
export function readPrecacheUrls(swSource: string): string[] {
  return Array.from(swSource.matchAll(URL_PATTERN), (match) => match[2])
}

/** Fichiers du service worker lui-même, jamais pré-cachés. */
const SW_FILE = /^(?:sw\.js|workbox-[^/]*\.js)$/

/** Chemins POSIX relatifs (triés) des fichiers de `distDir`, hors service worker, éléments cachés et dossier `docs/`. */
export function listDistFiles(distDir: string): string[] {
  const files: string[] = []
  const walk = (relativeDir: string): void => {
    for (const entry of readdirSync(join(distDir, relativeDir), { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      // La doc VitePress (F27, D96) n'est pas pré-cachée, c'est voulu.
      if (relativeDir === '' && entry.name === 'docs') continue
      const relative = relativeDir === '' ? entry.name : `${relativeDir}/${entry.name}`
      if (entry.isDirectory()) walk(relative)
      else if (!SW_FILE.test(relative)) files.push(relative)
    }
  }
  walk('')
  return files.toSorted((a, b) => a.localeCompare(b))
}

/** Fichiers émis absents du manifeste de pré-cache. */
export function findMissing(files: readonly string[], precached: readonly string[]): string[] {
  const known = new Set(precached)
  return files.filter((file) => !known.has(file))
}

/** Entrées du manifeste qui appartiennent à la doc (`docs/…`), interdites dans le pré-cache (D96). */
export function findDocsEntries(precached: readonly string[]): string[] {
  return precached.filter((url) => url.startsWith('docs/'))
}

/** Code de sortie : 0 si tout `distDir` est pré-caché, 1 sinon (`report` reçoit les messages d'erreur). */
export function main(
  distDir: string,
  report: (line: string) => void = (line) => console.error(line),
): number {
  const precached = readPrecacheUrls(readFileSync(join(distDir, 'sw.js'), 'utf8'))
  // Garde de non-vacuité : sans entrée lue, tout fichier serait « absent » ou le format aurait changé.
  if (precached.length === 0) {
    report('Manifeste de pré-cache vide ou illisible dans sw.js (format Workbox modifié ?).')
    return 1
  }
  const docsEntries = findDocsEntries(precached)
  if (docsEntries.length > 0) {
    report("Fichiers de la doc présents dans le pré-cache de l'app :")
    for (const url of docsEntries) report(`  - ${url}`)
    return 1
  }
  const missing = findMissing(listDistFiles(distDir), precached)
  if (missing.length > 0) {
    report(
      'Fichiers du build absents du pré-cache (fichier trop gros pour maximumFileSizeToCacheInBytes ?) :',
    )
    for (const file of missing) report(`  - ${file}`)
    return 1
  }
  console.log(`Pré-cache complet : ${precached.length} entrées couvrent tout le build.`)
  return 0
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main('dist'))
