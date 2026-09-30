/**
 * Vérifie que les bibliothèques lourdes (Recharts et son wrapper shadcn, F15/D70 ; xlsx, F16/D71)
 * restent hors du bundle initial.
 * Lancé par `pnpm check:bundle` après `pnpm build` ; nécessite `build.manifest: true`.
 * Exécuté par Node natif (types retirés) : imports avec extension `.ts`, syntaxe effaçable.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

/** Sous-ensemble d'une entrée du manifeste Vite utile ici. */
const manifestChunkSchema = z.object({
  file: z.string(),
  src: z.string().optional(),
  isEntry: z.boolean().optional(),
  isDynamicEntry: z.boolean().optional(),
  imports: z.array(z.string()).optional(),
  dynamicImports: z.array(z.string()).optional(),
})
const manifestSchema = z.record(z.string(), manifestChunkSchema)

export type ManifestChunk = z.infer<typeof manifestChunkSchema>

/**
 * Clés du manifeste atteintes par imports statiques depuis les entrées `isEntry`
 * et correspondant au motif interdit. Les `dynamicImports` ne sont pas suivis.
 */
export function findInitialLeaks(
  manifest: Record<string, ManifestChunk>,
  forbidden: RegExp,
): string[] {
  const visited = new Set<string>()
  const queue = Object.keys(manifest).filter((key) => manifest[key]?.isEntry === true)
  const leaks: string[] = []
  for (const key of queue) {
    if (visited.has(key)) continue
    visited.add(key)
    const chunk = manifest[key]
    if (forbidden.test(key) || (chunk?.src !== undefined && forbidden.test(chunk.src))) {
      leaks.push(key)
    }
    queue.push(...(chunk?.imports ?? []))
  }
  return leaks
}

/** Clés atteintes par imports statiques depuis `start` (inclus). */
function staticClosure(manifest: Record<string, ManifestChunk>, start: string): Set<string> {
  const visited = new Set<string>()
  const queue = [start]
  for (const key of queue) {
    if (visited.has(key) || manifest[key] === undefined) continue
    visited.add(key)
    queue.push(...(manifest[key].imports ?? []))
  }
  return visited
}

/**
 * Garde-fou de non-vacuité : sans chunk nommé, ou si l'importeur (écran des statistiques,
 * `write-workbook.ts`) ne l'atteint plus, `findInitialLeaks` passerait sans rien vérifier (chunk
 * inliné ailleurs, groupe renommé, module déplacé). Renvoie les problèmes constatés, [] si le contrôle a du sens.
 */
export function findVacuityProblems(
  manifest: Record<string, ManifestChunk>,
  chunkPattern: RegExp,
  routeKey: string,
): string[] {
  const chunkKeys = Object.keys(manifest).filter((key) => chunkPattern.test(key))
  if (chunkKeys.length === 0) {
    return [
      `aucun chunk ${String(chunkPattern)} dans le manifeste (groupe \`codeSplitting\` disparu ?)`,
    ]
  }
  if (manifest[routeKey] === undefined) {
    return [`entrée ${routeKey} absente du manifeste (route renommée ou découpage changé ?)`]
  }
  const reachable = staticClosure(manifest, routeKey)
  if (!chunkKeys.some((key) => reachable.has(key))) {
    return [`${routeKey} n'importe pas statiquement ${chunkKeys.join(', ')}`]
  }
  return []
}

/** Clé du chunk produit par le groupe `recharts` de `vite.config.ts` (`_recharts-<hash>.js`). */
export const RECHARTS_CHUNK = /^_recharts[.-]/
/** Chunk paresseux du composant de l'écran des statistiques (autoCodeSplitting TanStack). */
export const STATS_ROUTE_KEY = 'src/routes/session.$sessionId_.stats.tsx?tsr-split=component'

// Chunk `recharts` (vite.config.ts, codeSplitting) : clé `_recharts-<hash>.js` dans le manifeste.
// Repli : chemins sources (pnpm : node_modules/.pnpm/recharts@x/node_modules/recharts/…) et wrapper.
export const RECHARTS_FORBIDDEN =
  /(?:^_recharts[.-])|(?:node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?recharts\/)|(?:src\/components\/ui\/chart\.tsx)/
/** Une bibliothèque lourde à garder hors du bundle initial. */
export type BundleTarget = {
  name: string
  /** Clé du chunk produit par son groupe `codeSplitting` (`_<nom>-<hash>.js`). */
  chunk: RegExp
  /** Clé du manifeste du module qui doit l'atteindre statiquement (garde de non-vacuité). */
  importer: string
  /** Motif interdit dans le graphe statique depuis les entrées. */
  forbidden: RegExp
}

export const XLSX_CHUNK = /^_xlsx[.-]/
export const XLSX_IMPORTER = 'src/lib/xlsx/write-workbook.ts'
export const XLSX_FORBIDDEN =
  /(?:^_xlsx[.-])|(?:node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(?:write-excel-file|fflate)\/)|(?:^src\/lib\/xlsx\/)/

export const BUNDLE_TARGETS: BundleTarget[] = [
  {
    name: 'recharts',
    chunk: RECHARTS_CHUNK,
    importer: STATS_ROUTE_KEY,
    forbidden: RECHARTS_FORBIDDEN,
  },
  { name: 'xlsx', chunk: XLSX_CHUNK, importer: XLSX_IMPORTER, forbidden: XLSX_FORBIDDEN },
]

/** Problèmes (vacuité puis fuites) de chaque cible ; [] si le bundle initial est propre. */
export function checkTargets(
  manifest: Record<string, ManifestChunk>,
  targets: BundleTarget[],
): string[] {
  return targets.flatMap((target) => [
    ...findVacuityProblems(manifest, target.chunk, target.importer).map(
      (problem) => `${target.name} : contrôle sans objet, ${problem}`,
    ),
    // Contrôlées même si la garde échoue : une fuite explique souvent l'absence de l'importeur.
    ...findInitialLeaks(manifest, target.forbidden).map(
      (leak) => `${target.name} fuit dans le bundle initial : ${leak}`,
    ),
  ])
}

const MANIFEST_PATH = 'dist/.vite/manifest.json'

function main(): void {
  const manifest = manifestSchema.parse(JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')))
  const problems = checkTargets(manifest, BUNDLE_TARGETS)
  if (problems.length > 0) {
    console.error('Contrôle du bundle initial en échec :')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log(`Bundle initial sans ${BUNDLE_TARGETS.map((target) => target.name).join(', ')}.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
