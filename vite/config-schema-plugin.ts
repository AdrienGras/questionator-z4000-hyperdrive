import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { runnerImport, type Plugin, type ResolvedConfig } from 'vite'

export const SCHEMA_FILE_NAME = 'config.schema.json'
export const EXAMPLE_FILE_NAME = 'config.example.json'
export const STUDENTS_EXAMPLE_FILE_NAME = 'students.example.csv'

const SRC_DIR = fileURLToPath(new URL('../src', import.meta.url))
const SCHEMA_MODULE = fileURLToPath(new URL('../src/domain/config/json-schema.ts', import.meta.url))
const EXAMPLE_FILE = fileURLToPath(new URL('../examples/config.example.json', import.meta.url))
const STUDENTS_EXAMPLE_FILE = fileURLToPath(
  new URL('../examples/students.example.csv', import.meta.url),
)

type JsonSchemaModule = { buildConfigJsonSchema: () => Record<string, unknown> }

/** Nom du fichier servi si `url` le désigne sous `base`, sinon `undefined`. */
export function matchConfigAsset(url: string | undefined, base: string): string | undefined {
  const pathname = url?.split('?')[0]
  return [SCHEMA_FILE_NAME, EXAMPLE_FILE_NAME, STUDENTS_EXAMPLE_FILE_NAME].find(
    (name) => pathname === `${base}${name}`,
  )
}

/**
 * Charge le module de schéma hors de l'application (sans vite.config.ts), lit l'exemple de config
 * et la liste d'étudiants d'exemple (BOM conservé), et renvoie la liste des fichiers à surveiller :
 * les dépendances transitives de `json-schema.ts` (tout `src/domain/config/`, cf. D17) plus les exemples
 * eux-mêmes.
 */
export async function renderConfigAssets(): Promise<{
  schema: string
  example: string
  studentsExample: string
  watchFiles: string[]
}> {
  const { module, dependencies } = await runnerImport<JsonSchemaModule>(SCHEMA_MODULE, {
    configFile: false,
    // Même alias que vite.config.ts : le code de src/ importe par `@/` (#31).
    resolve: { alias: { '@': SRC_DIR } },
  })
  const schema = `${JSON.stringify(module.buildConfigJsonSchema(), null, 2)}\n`
  const example = await readFile(EXAMPLE_FILE, 'utf8')
  const studentsExample = await readFile(STUDENTS_EXAMPLE_FILE, 'utf8')
  const watchFiles = [
    ...new Set([SCHEMA_MODULE, ...dependencies, EXAMPLE_FILE, STUDENTS_EXAMPLE_FILE]),
  ]
  return { schema, example, studentsExample, watchFiles }
}

/** Contenu et type MIME de chaque asset rendu, par nom de fichier publié. */
function assetsByFileName(rendered: {
  schema: string
  example: string
  studentsExample: string
}): Record<string, { content: string; type: string }> {
  return {
    [SCHEMA_FILE_NAME]: { content: rendered.schema, type: 'application/json; charset=utf-8' },
    [EXAMPLE_FILE_NAME]: { content: rendered.example, type: 'application/json; charset=utf-8' },
    [STUDENTS_EXAMPLE_FILE_NAME]: {
      content: rendered.studentsExample,
      type: 'text/csv; charset=utf-8',
    },
  }
}

/** Publie config.schema.json, config.example.json et students.example.csv à la racine du site (D17, D56). */
export function configSchemaPlugin(): Plugin {
  let rendered: { schema: string; example: string; studentsExample: string } | undefined
  let command: ResolvedConfig['command'] | undefined

  return {
    name: 'questionator:config-schema',
    configResolved(config) {
      command = config.command
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const fileName = matchConfigAsset(req.url, server.config.base)
        if (!fileName) {
          next()
          return
        }
        // Le `.catch` terminal capte aussi une exception de `setHeader`/`end` : réponse 500.
        renderConfigAssets()
          .then((assets) => {
            const asset = assetsByFileName(assets)[fileName]
            if (!asset) {
              next()
              return
            }
            res.setHeader('Content-Type', asset.type)
            res.end(asset.content)
          })
          .catch((error: unknown) => {
            next(error)
          })
      })
    },
    /** En dev, seul le middleware rend les fichiers : une erreur n'y bloque pas le démarrage. */
    async buildStart() {
      if (command !== 'build') return
      const { schema, example, studentsExample, watchFiles } = await renderConfigAssets()
      rendered = { schema, example, studentsExample }
      for (const file of watchFiles) this.addWatchFile(file)
    },
    generateBundle() {
      if (!rendered) {
        throw new Error('questionator:config-schema : buildStart ne s’est pas exécuté')
      }
      this.emitFile({ type: 'asset', fileName: SCHEMA_FILE_NAME, source: rendered.schema })
      this.emitFile({ type: 'asset', fileName: EXAMPLE_FILE_NAME, source: rendered.example })
      this.emitFile({
        type: 'asset',
        fileName: STUDENTS_EXAMPLE_FILE_NAME,
        source: rendered.studentsExample,
      })
    },
  }
}
