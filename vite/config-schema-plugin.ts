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

/** Charge le module de schéma hors de l'application (sans vite.config.ts) et lit l'exemple. */
export async function renderConfigAssets(): Promise<{ schema: string; example: string }> {
  const { module } = await runnerImport<JsonSchemaModule>(SCHEMA_MODULE, { configFile: false })
  const schema = `${JSON.stringify(module.buildConfigJsonSchema(), null, 2)}\n`
  const example = await readFile(EXAMPLE_FILE, 'utf8')
  return { schema, example }
}

/** Publie config.schema.json et config.example.json à la racine du site (D17). */
export function configSchemaPlugin(): Plugin {
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
    buildStart() {
      this.addWatchFile(EXAMPLE_FILE)
    },
    async generateBundle() {
      const { schema, example } = await renderConfigAssets()
      this.emitFile({ type: 'asset', fileName: SCHEMA_FILE_NAME, source: schema })
      this.emitFile({ type: 'asset', fileName: EXAMPLE_FILE_NAME, source: example })
    },
  }
}
