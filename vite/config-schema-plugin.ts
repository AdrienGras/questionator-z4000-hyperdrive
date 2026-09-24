import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { runnerImport, type Plugin } from 'vite'

export const SCHEMA_FILE_NAME = 'config.schema.json'
export const EXAMPLE_FILE_NAME = 'config.example.json'

const SCHEMA_MODULE = fileURLToPath(new URL('../src/config/json-schema.ts', import.meta.url))
const EXAMPLE_FILE = fileURLToPath(new URL('../examples/config.example.json', import.meta.url))

type JsonSchemaModule = { buildConfigJsonSchema: () => Record<string, unknown> }

/** Nom du fichier servi si `url` le désigne sous `base`, sinon `undefined`. */
export function matchConfigAsset(url: string | undefined, base: string): string | undefined {
  const pathname = url?.split('?')[0]
  return [SCHEMA_FILE_NAME, EXAMPLE_FILE_NAME].find((name) => pathname === `${base}${name}`)
}

/**
 * Charge le module de schéma hors de l'application (sans vite.config.ts), lit l'exemple, et
 * renvoie la liste des fichiers à surveiller : les dépendances transitives de `json-schema.ts`
 * (tout `src/config/`, cf. D17) plus l'exemple lui-même.
 */
export async function renderConfigAssets(): Promise<{
  schema: string
  example: string
  watchFiles: string[]
}> {
  const { module, dependencies } = await runnerImport<JsonSchemaModule>(SCHEMA_MODULE, {
    configFile: false,
  })
  const schema = `${JSON.stringify(module.buildConfigJsonSchema(), null, 2)}\n`
  const example = await readFile(EXAMPLE_FILE, 'utf8')
  const watchFiles = [...new Set([SCHEMA_MODULE, ...dependencies, EXAMPLE_FILE])]
  return { schema, example, watchFiles }
}

/** Publie config.schema.json et config.example.json à la racine du site (D17). */
export function configSchemaPlugin(): Plugin {
  let rendered: { schema: string; example: string } | undefined

  return {
    name: 'questionator:config-schema',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const fileName = matchConfigAsset(req.url, server.config.base)
        if (!fileName) {
          next()
          return
        }
        renderConfigAssets().then(
          ({ schema, example }) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(fileName === SCHEMA_FILE_NAME ? schema : example)
          },
          (error: unknown) => {
            next(error)
          },
        )
      })
    },
    async buildStart() {
      const { schema, example, watchFiles } = await renderConfigAssets()
      rendered = { schema, example }
      for (const file of watchFiles) this.addWatchFile(file)
    },
    generateBundle() {
      if (!rendered) {
        throw new Error('questionator:config-schema : buildStart ne s’est pas exécuté')
      }
      this.emitFile({ type: 'asset', fileName: SCHEMA_FILE_NAME, source: rendered.schema })
      this.emitFile({ type: 'asset', fileName: EXAMPLE_FILE_NAME, source: rendered.example })
    },
  }
}
