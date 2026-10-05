import { z } from 'zod'
import { ICON_NAMES } from './icon-names'
import { ConfigSchema, IconSchema } from './schema'
import { hoverValues, TABLER_ICONS_URL, type SchemaValueNode } from './schema-values'

export const CONFIG_SCHEMA_URL =
  'https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json'

export const CONFIG_SCHEMA_LITE_URL =
  'https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.lite.json'

/**
 * JSON Schema publié à la racine du site (D17). Structure seule : les règles croisées ne sont
 * vérifiées que par l'application. `icon` propose les noms Tabler sans refuser les autres.
 *
 * Avec `lite` (F43), `icon` n'est plus qu'une chaîne, sans la liste de ~6 200 noms : le schéma
 * allégé existe pour les LLM, dont les outils de lecture tronquent le fichier complet avant
 * `questions`. Hors de `icon` et de `$id`, les deux sorties sont identiques.
 */
export function buildConfigJsonSchema(options: { lite?: boolean } = {}): Record<string, unknown> {
  const lite = options.lite === true
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
      if (lite) node.type = 'string'
      else node.anyOf = [{ enum: [...ICON_NAMES] }, { type: 'string' }]
      if (description !== undefined) node.description = description
      if (defaultValue !== undefined) node.default = defaultValue
    },
  })
  addMarkdownDescriptions(schema)
  return {
    ...schema,
    $id: lite ? CONFIG_SCHEMA_LITE_URL : CONFIG_SCHEMA_URL,
    title: 'Questionator Z-4000 Hyperdrive — configuration',
  }
}

/**
 * Le survol de vscode-json-languageservice n'affiche que `title`, `markdownDescription` (à défaut
 * `description`) et les descriptions d'enum, jamais `default` : on recopie dans
 * `markdownDescription` les valeurs possibles (lien de recherche Tabler pour `icon`) et le défaut,
 * comme le survol de l'éditeur de l'app (F40). `description` reste brut (l'éditeur de l'app l'affiche tel quel).
 */
function addMarkdownDescriptions(node: unknown): void {
  if (Array.isArray(node)) {
    for (const item of node) addMarkdownDescriptions(item)
    return
  }
  if (!isRecord(node)) return
  const record = node
  if (typeof record.description === 'string') {
    const parts = [record.description]
    const values = hoverValues(toValueNode(record))
    if (values?.kind === 'closed') {
      parts.push(`Valeurs possibles : ${values.values.map(inlineCode).join(', ')}`)
    }
    if (values?.kind === 'open')
      parts.push(`[Rechercher une icône sur tabler.io](${TABLER_ICONS_URL})`)
    if ('default' in record) parts.push(`Défaut : ${inlineCode(JSON.stringify(record.default))}`)
    record.markdownDescription = parts.join('\n\n')
  }
  const { properties, items, anyOf } = record
  if (isRecord(properties)) {
    for (const child of Object.values(properties)) addMarkdownDescriptions(child)
  }
  addMarkdownDescriptions(items)
  addMarkdownDescriptions(anyOf)
}

/** Code Markdown en ligne. */
function inlineCode(text: string): string {
  return '`' + text + '`'
}

/** Champs d'un nœud brut utiles aux valeurs littérales, vérifiés un par un (pas d'assertion). */
function toValueNode(record: Record<string, unknown>): SchemaValueNode {
  const { type, enum: values, anyOf } = record
  const node: SchemaValueNode = {}
  if (typeof type === 'string') node.type = type
  else if (Array.isArray(type)) node.type = type.filter((item) => typeof item === 'string')
  if (Array.isArray(values)) node.enum = values
  if ('const' in record) node.const = record.const
  if (Array.isArray(anyOf)) node.anyOf = anyOf.filter(isRecord).map(toValueNode)
  return node
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
