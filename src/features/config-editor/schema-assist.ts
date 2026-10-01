import { findNodeAtLocation, getLocation, parseTree, type Node } from 'jsonc-parser'
import { buildConfigJsonSchema } from '@/domain/config/json-schema'

/** Sous-ensemble du JSON Schema produit par `buildConfigJsonSchema()` (schéma entièrement inliné). */
export type SchemaNode = {
  type?: string | string[]
  properties?: Record<string, SchemaNode>
  items?: SchemaNode
  anyOf?: SchemaNode[]
  enum?: unknown[]
  const?: unknown
  description?: string
  default?: unknown
}

export type AssistCompletion = { label: string; apply: string; detail?: string; info?: string }
export type AssistCompletions = { from: number; to: number; options: AssistCompletion[] }
export type AssistHover = { from: number; to: number; description: string; default?: unknown }

type Path = readonly (string | number)[]

/** Descend dans le schéma ; sur un `anyOf`, la première branche qui répond l'emporte. */
export function schemaAt(root: SchemaNode, path: Path): SchemaNode | undefined {
  if (path.length === 0) return root
  const [head, ...rest] = path
  if (head === undefined) return root
  if (root.anyOf) {
    for (const branch of root.anyOf) {
      const found = schemaAt(branch, path)
      if (found) return found
    }
  }
  const child = typeof head === 'number' ? root.items : root.properties?.[head]
  return child ? schemaAt(child, rest) : undefined
}

/** Le curseur est strictement à l'intérieur de la chaîne (guillemets compris, chaîne éventuellement non fermée). */
function containsCursor(text: string, node: Node, offset: number): boolean {
  const end = node.offset + node.length
  const closed = node.length >= 2 && text[end - 1] === '"'
  return offset > node.offset && (closed ? offset < end : offset <= end)
}

type Context = {
  /** Chaîne (clé ou valeur) sous le curseur, le cas échéant. */
  string: Node | undefined
  isKey: boolean
  /** Chemin de la clé / valeur visée (dernier segment vide si la clé n'est pas encore tapée). */
  path: Path
  /** Chemin de l'objet qui contient la clé. */
  parentPath: Path
}

function contextAt(text: string, offset: number): Context {
  const location = getLocation(text, offset)
  const previous = location.previousNode
  // Pour une clé, jsonc-parser renvoie un nœud `property` dont la plage est celle de la clé seule.
  const isString =
    previous?.type === 'string' || (location.isAtPropertyKey && previous?.type === 'property')
  const string =
    previous && isString && containsCursor(text, previous, offset) ? previous : undefined
  return {
    string,
    isKey: location.isAtPropertyKey,
    path: location.path,
    parentPath: location.path.slice(0, -1),
  }
}

function typeLabel(node: SchemaNode): string | undefined {
  if (typeof node.type === 'string') return node.type
  if (Array.isArray(node.type)) return node.type.join(' | ')
  return undefined
}

/** Clés déjà présentes dans l'objet, hors la clé en cours de frappe. */
function siblingKeys(text: string, parentPath: Path, typed: Node | undefined): Set<string> {
  const tree = parseTree(text)
  const object = tree ? findNodeAtLocation(tree, [...parentPath]) : undefined
  const keys = new Set<string>()
  if (object?.type !== 'object') return keys
  for (const property of object.children ?? []) {
    const key = property.children?.[0]
    if (key && key.offset !== typed?.offset && typeof key.value === 'string') keys.add(key.value)
  }
  return keys
}

function keyCompletions(text: string, root: SchemaNode, ctx: Context): AssistCompletion[] {
  const parent = schemaAt(root, ctx.parentPath)
  if (!parent?.properties) return []
  const present = siblingKeys(text, ctx.parentPath, ctx.string)
  return Object.entries(parent.properties)
    .filter(([key]) => !present.has(key))
    .map(([key, node]) => ({
      label: key,
      apply: `${JSON.stringify(key)}: `,
      detail: typeLabel(node),
      info: node.description,
    }))
}

/** Valeurs littérales proposables, en parcourant récursivement les `anyOf`. */
function collectValues(node: SchemaNode, out: unknown[]): void {
  if (node.enum) out.push(...node.enum)
  if (node.const !== undefined) out.push(node.const)
  const types = Array.isArray(node.type) ? node.type : node.type ? [node.type] : []
  if (types.includes('boolean')) out.push(true, false)
  if (types.includes('null')) out.push(null)
  for (const branch of node.anyOf ?? []) collectValues(branch, out)
}

function valueCompletions(root: SchemaNode, path: Path): AssistCompletion[] {
  const node = schemaAt(root, path)
  if (!node) return []
  const values: unknown[] = []
  collectValues(node, values)
  const seen = new Set<string>()
  const options: AssistCompletion[] = []
  for (const value of values) {
    const literal = JSON.stringify(value)
    if (seen.has(literal)) continue
    seen.add(literal)
    options.push({ label: literal, apply: literal })
  }
  return options
}

/** Propositions de clés ou de valeurs à `offset`, ou `undefined` si le schéma n'a rien à suggérer. */
export function completionsAt(
  text: string,
  offset: number,
  root: SchemaNode,
): AssistCompletions | undefined {
  const ctx = contextAt(text, offset)
  const options = ctx.isKey ? keyCompletions(text, root, ctx) : valueCompletions(root, ctx.path)
  if (options.length === 0) return undefined
  const from = ctx.string ? ctx.string.offset : offset
  const to = ctx.string ? ctx.string.offset + ctx.string.length : offset
  return { from, to, options }
}

/** Description (et défaut) de la propriété dont la clé est sous `offset`. */
export function hoverAt(text: string, offset: number, root: SchemaNode): AssistHover | undefined {
  const ctx = contextAt(text, offset)
  if (!ctx.isKey || !ctx.string) return undefined
  const node = schemaAt(root, ctx.path)
  if (!node?.description) return undefined
  const hover: AssistHover = {
    from: ctx.string.offset,
    to: ctx.string.offset + ctx.string.length,
    description: node.description,
  }
  if ('default' in node) hover.default = node.default
  return hover
}

let cached: SchemaNode | undefined

/** `buildConfigJsonSchema()` mémorisé, typé `SchemaNode`. */
export function configJsonSchema(): SchemaNode {
  cached ??= buildConfigJsonSchema() as SchemaNode
  return cached
}
