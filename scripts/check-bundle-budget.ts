/**
 * Budgets de taille du build (#86, D88), en gzip : le premier affichage de l'accueil (JS et CSS
 * atteints statiquement depuis l'entrée et depuis la route `/`, chargée aussitôt malgré son
 * découpage paresseux) et chaque chunk JS, hors chunk des icônes Tabler (D37) et hors
 * grammaires et thèmes Shiki (chargés un par un, à la demande, F18). Vérifie aussi que les icônes
 * Tabler restent dans leur chunk. Complète `check:bundle`, qui ne regarde que la présence des
 * bibliothèques lourdes, pas les tailles.
 * Lancé par `pnpm check:budget` après `pnpm build` ; nécessite `build.manifest: true`.
 * Exécuté par Node natif (types retirés) : imports avec extension `.ts`, syntaxe effaçable.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import {
  HOME_ROUTE_KEY,
  MANIFEST_PATH,
  manifestSchema,
  staticClosure,
  type ManifestChunk,
} from './check-initial-bundle.ts'

const KB = 1024

/**
 * Budgets, environ 15 % au-dessus des tailles mesurées le 2026-10-01 (gzip) : premier affichage de
 * l'accueil 238,5 Ko (entrée 164,6 Ko dont 15,2 Ko de CSS, route `/` 73,9 Ko) ; plus gros chunk
 * soumis au budget, `codemirror`, 116,0 Ko. À relever en connaissance de cause quand l'application grandit, jamais pour absorber
 * une fuite que `check:bundle` aurait dû voir.
 */
export const INITIAL_BUDGET = 275 * KB
export const CHUNK_BUDGET = 135 * KB

/** Nom d'affichage d'une icône Tabler, présent seulement dans le chunk des icônes (D37). */
export const ICON_MARKER = 'IconBrandPhp'

export { HOME_ROUTE_KEY }

const ICONS_FILE = /(?:^|\/)icons-[^/]+\.js$/
const SHIKI_ASSET = /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?@shikijs\/(?:langs|themes)\//

type Manifest = Record<string, ManifestChunk>

/** Accès aux fichiers de `dist/`, injecté pour les tests. */
export type BuildFiles = {
  gzipSize: (file: string) => number
  contents: (file: string) => string
}

/** Ko à une décimale, virgule française (`1536` → `1,5`). */
export function formatKb(bytes: number): string {
  return (bytes / KB).toFixed(1).replace('.', ',')
}

function overBudget(label: string, size: number, budget: number): string {
  // Écart arrondi au dixième de Ko supérieur : un octet de trop ne doit pas s'afficher « +0,0 ».
  const overshoot = (Math.ceil(((size - budget) / KB) * 10) / 10) * KB
  return `${label} : ${formatKb(size)} Ko gzip, budget ${formatKb(budget)} Ko (+${formatKb(overshoot)} Ko)`
}

/**
 * Fichiers (JS et CSS, sans doublon) du premier affichage de l'accueil : atteints statiquement
 * depuis les entrées `isEntry` et depuis la route `/`.
 */
function initialFiles(manifest: Manifest): Set<string> {
  const result = new Set<string>()
  const starts = Object.keys(manifest).filter((key) => manifest[key]?.isEntry === true)
  for (const start of [...starts, HOME_ROUTE_KEY]) {
    for (const key of staticClosure(manifest, start)) {
      const chunk = manifest[key]
      if (chunk === undefined) continue
      result.add(chunk.file)
      for (const css of chunk.css ?? []) result.add(css)
    }
  }
  return result
}

/** Gardes de non-vacuité sur le manifeste : une entrée et la route d'accueil. */
function manifestProblems(manifest: Manifest): string[] {
  const problems: string[] = []
  if (!Object.values(manifest).some((chunk) => chunk.isEntry === true)) {
    problems.push('aucune entrée isEntry dans le manifeste')
  }
  if (manifest[HOME_ROUTE_KEY] === undefined) {
    problems.push(`route ${HOME_ROUTE_KEY} absente du manifeste (route renommée ?)`)
  }
  return problems
}

/** Clés du manifeste par fichier JS : un fichier n'est exempté que si toutes ses clés le sont. */
function jsChunks(manifest: Manifest): Map<string, string[]> {
  const chunks = new Map<string, string[]>()
  for (const [key, chunk] of Object.entries(manifest)) {
    if (!chunk.file.endsWith('.js')) continue
    chunks.set(chunk.file, [...(chunks.get(chunk.file) ?? []), key])
  }
  return chunks
}

/** Garde : un chunk `icons-*` existe et porte le marqueur. */
function iconChunkProblems(chunks: Map<string, string[]>, build: BuildFiles): string[] {
  const iconFiles = [...chunks.keys()].filter((file) => ICONS_FILE.test(file))
  if (iconFiles.length === 0) {
    return ['aucun chunk icons-* dans le manifeste (groupe des icônes renommé ?)']
  }
  if (!iconFiles.some((file) => build.contents(file).includes(ICON_MARKER))) {
    return [`${ICON_MARKER} absent du chunk des icônes : marqueur à mettre à jour`]
  }
  return []
}

/** Budget par chunk et marqueur d'icônes, hors chunk des icônes ; plus gros chunk soumis au budget. */
function chunkProblems(
  chunks: Map<string, string[]>,
  build: BuildFiles,
): { problems: string[]; largest: { file: string; size: number } } {
  const problems: string[] = []
  let shikiExempt = 0
  let largest = { file: '', size: 0 }
  for (const [file, keys] of chunks) {
    if (ICONS_FILE.test(file)) continue
    if (build.contents(file).includes(ICON_MARKER)) {
      problems.push(`${ICON_MARKER} hors du chunk des icônes : ${file}`)
    }
    if (keys.every((key) => SHIKI_ASSET.test(key))) {
      shikiExempt += 1
      continue
    }
    const size = build.gzipSize(file)
    if (size > largest.size) largest = { file, size }
    if (size > CHUNK_BUDGET) problems.push(overBudget(file, size, CHUNK_BUDGET))
  }
  if (shikiExempt === 0) {
    problems.push('aucune grammaire ni thème Shiki exemptés (chemin @shikijs changé ?)')
  }
  return { problems, largest }
}

/** Problèmes de budget ou de garde (`[]` si tout va bien) et ligne de résumé pour la console. */
export function checkBudgets(
  manifest: Manifest,
  build: BuildFiles,
): { problems: string[]; summary: string } {
  let initialSize = 0
  for (const file of initialFiles(manifest)) initialSize += build.gzipSize(file)
  const initial =
    initialSize > INITIAL_BUDGET
      ? [overBudget('premier affichage de l’accueil', initialSize, INITIAL_BUDGET)]
      : []

  const chunks = jsChunks(manifest)
  const perChunk = chunkProblems(chunks, build)
  const problems = [
    ...manifestProblems(manifest),
    ...initial,
    ...iconChunkProblems(chunks, build),
    ...perChunk.problems,
  ]
  const summary =
    `Premier affichage de l’accueil ${formatKb(initialSize)} Ko gzip (budget ${formatKb(INITIAL_BUDGET)} Ko) ; ` +
    `plus gros chunk ${perChunk.largest.file} ${formatKb(perChunk.largest.size)} Ko (budget ${formatKb(CHUNK_BUDGET)} Ko).`
  return { problems, summary }
}

const DIST = 'dist'

function main(): void {
  const manifest = manifestSchema.parse(JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')))
  const { problems, summary } = checkBudgets(manifest, {
    gzipSize: (file) => gzipSync(readFileSync(join(DIST, file))).length,
    contents: (file) => readFileSync(join(DIST, file), 'utf8'),
  })
  if (problems.length > 0) {
    console.error('Budget du build dépassé :')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log(summary)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
