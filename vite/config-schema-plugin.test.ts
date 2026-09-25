// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  configSchemaPlugin,
  EXAMPLE_FILE_NAME,
  matchConfigAsset,
  renderConfigAssets,
  SCHEMA_FILE_NAME,
  STUDENTS_EXAMPLE_FILE_NAME,
} from './config-schema-plugin'

const BASE = '/questionator-z4000-hyperdrive/'

describe('matchConfigAsset', () => {
  test('reconnaît les trois fichiers sous la base, avec ou sans query', () => {
    expect(matchConfigAsset(`${BASE}config.schema.json`, BASE)).toBe(SCHEMA_FILE_NAME)
    expect(matchConfigAsset(`${BASE}config.example.json?t=1`, BASE)).toBe(EXAMPLE_FILE_NAME)
    expect(matchConfigAsset(`${BASE}students.example.csv`, BASE)).toBe(STUDENTS_EXAMPLE_FILE_NAME)
  })

  test('ignore les autres chemins', () => {
    expect(matchConfigAsset('/config.schema.json', BASE)).toBeUndefined()
    expect(matchConfigAsset(`${BASE}index.html`, BASE)).toBeUndefined()
    expect(matchConfigAsset(undefined, BASE)).toBeUndefined()
  })
})

describe('renderConfigAssets', () => {
  test('génère le schéma via runnerImport et recopie l’exemple', async () => {
    const { schema, example, studentsExample, watchFiles } = await renderConfigAssets()
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- schema généré par buildConfigJsonSchema() puis reparsé : on affirme juste la forme qu'on vient d'écrire.
    const parsed = JSON.parse(schema) as { $id: string }
    expect(parsed.$id).toBe(
      'https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json',
    )
    const exampleFile = await readFile(
      new URL('../examples/config.example.json', import.meta.url),
      'utf8',
    )
    expect(example).toBe(exampleFile)
    const studentsExampleFile = await readFile(
      new URL('../examples/students.example.csv', import.meta.url),
      'utf8',
    )
    expect(studentsExample).toBe(studentsExampleFile)
    expect(watchFiles).toEqual(
      expect.arrayContaining([
        fileURLToPath(new URL('../src/domain/config/json-schema.ts', import.meta.url)),
        fileURLToPath(new URL('../src/domain/config/schema.ts', import.meta.url)),
        fileURLToPath(new URL('../examples/config.example.json', import.meta.url)),
        fileURLToPath(new URL('../examples/students.example.csv', import.meta.url)),
      ]),
    )
  }, 30_000)
})

/** Déroule un hook Rollup, qu'il soit une fonction ou un objet `{ handler }`. */
function handlerOf(hook: unknown): unknown {
  return typeof hook === 'object' && hook !== null && 'handler' in hook ? hook.handler : hook
}

/** Joue configResolved puis buildStart avec un contexte factice ; renvoie les fichiers surveillés. */
async function watchedFilesFor(command: 'serve' | 'build'): Promise<string[]> {
  const plugin = configSchemaPlugin()
  const configResolved = handlerOf(plugin.configResolved)
  const buildStart = handlerOf(plugin.buildStart)
  if (typeof configResolved !== 'function' || typeof buildStart !== 'function') {
    throw new TypeError('configResolved et buildStart doivent être définis')
  }
  const watched: string[] = []
  const context = {
    addWatchFile: (file: string) => {
      watched.push(file)
    },
  }
  await Reflect.apply(configResolved, context, [{ command }])
  await Reflect.apply(buildStart, context, [{}])
  return watched
}

describe('configSchemaPlugin.buildStart', () => {
  test('en dev (serve) : ne rend ni ne surveille rien', async () => {
    expect(await watchedFilesFor('serve')).toEqual([])
  })

  test('en build : surveille le module de schéma, ses dépendances et les exemples', async () => {
    const watched = await watchedFilesFor('build')
    expect(watched).toEqual(
      expect.arrayContaining([
        fileURLToPath(new URL('../src/domain/config/json-schema.ts', import.meta.url)),
        fileURLToPath(new URL('../src/domain/config/schema.ts', import.meta.url)),
        fileURLToPath(new URL('../examples/config.example.json', import.meta.url)),
        fileURLToPath(new URL('../examples/students.example.csv', import.meta.url)),
      ]),
    )
  }, 30_000)
})
