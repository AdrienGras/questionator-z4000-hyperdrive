import { z } from 'zod'
import { ICON_NAMES } from './icon-names'
import { ConfigSchema, IconSchema } from './schema'

export const CONFIG_SCHEMA_URL =
  'https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json'

/**
 * JSON Schema publié à la racine du site (D17). Structure seule : les règles croisées ne sont
 * vérifiées que par l'application. `icon` propose les noms Tabler sans refuser les autres.
 */
export function buildConfigJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(ConfigSchema, {
    target: 'draft-2020-12',
    io: 'input',
    override: (ctx) => {
      if (ctx.zodSchema !== IconSchema) return
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- ctx.jsonSchema est typé
      // par zod comme un JSONSchema générique restrictif ; on le traite comme un objet mutable
      // ordinaire pour le remplacer entièrement par l'anyOf ci-dessous.
      const node = ctx.jsonSchema as Record<string, unknown>
      const { description, default: defaultValue } = node
      for (const key of Object.keys(node)) delete node[key]
      node.anyOf = [{ enum: [...ICON_NAMES] }, { type: 'string' }]
      if (description !== undefined) node.description = description
      if (defaultValue !== undefined) node.default = defaultValue
    },
  })
  addMarkdownDescriptions(schema)
  return {
    ...schema,
    $id: CONFIG_SCHEMA_URL,
    title: 'Questionator Z-4000 Hyperdrive — configuration',
  }
}

/**
 * Le survol de vscode-json-languageservice n'affiche que `title`, `markdownDescription` (à défaut
 * `description`) et les descriptions d'enum, jamais `default` : on le recopie dans
 * `markdownDescription`. `description` reste brut (l'éditeur de l'app l'affiche tel quel).
 */
function addMarkdownDescriptions(node: unknown): void {
  if (Array.isArray(node)) {
    for (const item of node) addMarkdownDescriptions(item)
    return
  }
  if (!isRecord(node)) return
  const record = node
  if (typeof record.description === 'string') {
    record.markdownDescription =
      'default' in record
        ? `${record.description}\n\nDéfaut : \`${JSON.stringify(record.default)}\``
        : record.description
  }
  const { properties, items, anyOf } = record
  if (isRecord(properties)) {
    for (const child of Object.values(properties)) addMarkdownDescriptions(child)
  }
  addMarkdownDescriptions(items)
  addMarkdownDescriptions(anyOf)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
