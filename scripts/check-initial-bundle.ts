/**
 * Vérifie que Recharts (et son wrapper shadcn) reste hors du bundle initial (F15, D70).
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

// Chunk `recharts` (vite.config.ts, codeSplitting) : clé `_recharts-<hash>.js` dans le manifeste.
// Repli : chemins sources (pnpm : node_modules/.pnpm/recharts@x/node_modules/recharts/…) et wrapper.
export const FORBIDDEN =
  /^_recharts[.-]|node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?recharts\/|src\/components\/ui\/chart\.tsx/
const MANIFEST_PATH = 'dist/.vite/manifest.json'

function main(): void {
  const manifest = manifestSchema.parse(JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')))
  const leaks = findInitialLeaks(manifest, FORBIDDEN)
  if (leaks.length > 0) {
    console.error('Recharts fuit dans le bundle initial :')
    for (const leak of leaks) console.error(`  - ${leak}`)
    process.exit(1)
  }
  console.log('Bundle initial sans Recharts.')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
