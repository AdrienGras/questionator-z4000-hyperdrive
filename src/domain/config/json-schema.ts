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
      for (const key of Object.keys(node)) delete node[key]
      node.anyOf = [{ enum: [...ICON_NAMES] }, { type: 'string' }]
    },
  })
  return {
    ...schema,
    $id: CONFIG_SCHEMA_URL,
    title: 'Questionator Z-4000 Hyperdrive — configuration',
  }
}
