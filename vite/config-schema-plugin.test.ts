// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  EXAMPLE_FILE_NAME,
  matchConfigAsset,
  renderConfigAssets,
  SCHEMA_FILE_NAME,
} from './config-schema-plugin'

const BASE = '/questionator-z4000-hyperdrive/'

describe('matchConfigAsset', () => {
  test('reconnaît les deux fichiers sous la base, avec ou sans query', () => {
    expect(matchConfigAsset(`${BASE}config.schema.json`, BASE)).toBe(SCHEMA_FILE_NAME)
    expect(matchConfigAsset(`${BASE}config.example.json?t=1`, BASE)).toBe(EXAMPLE_FILE_NAME)
  })

  test('ignore les autres chemins', () => {
    expect(matchConfigAsset('/config.schema.json', BASE)).toBeUndefined()
    expect(matchConfigAsset(`${BASE}index.html`, BASE)).toBeUndefined()
    expect(matchConfigAsset(undefined, BASE)).toBeUndefined()
  })
})

describe('renderConfigAssets', () => {
  test('génère le schéma via runnerImport et recopie l’exemple', async () => {
    const { schema, example, watchFiles } = await renderConfigAssets()
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
    expect(watchFiles).toEqual(
      expect.arrayContaining([
        fileURLToPath(new URL('../src/config/json-schema.ts', import.meta.url)),
        fileURLToPath(new URL('../src/config/schema.ts', import.meta.url)),
        fileURLToPath(new URL('../examples/config.example.json', import.meta.url)),
      ]),
    )
  }, 30_000)
})
