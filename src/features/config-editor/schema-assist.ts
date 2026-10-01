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
  return offset > node.offset && (isClosed(text, node) ? offset < end : offset <= end)
}

/** Chaîne terminée par son guillemet fermant (le scanner étend sinon la chaîne jusqu'à la fin de ligne). */
function isClosed(text: string, node: Node): boolean {
  return node.length >= 2 && text[node.offset + node.length - 1] === '"'
}

type Context = {
  /** Chaîne (clé ou valeur) sous le curseur, le cas échéant. */
  string: Node | undefined
  /** Plage à remplacer pour `string` : une chaîne non fermée s'arrête au curseur, pas en fin de ligne. */
  range: { from: number; to: number } | undefined
  /** Plage du mot nu (`true`, `sc`…) en cours de frappe, vide si le curseur n'est pas dans un mot. */
  word: { from: number; to: number }
  /** Le curseur touche une chaîne sans y être (juste après ou juste avant) : rien à proposer. */
  touching: boolean
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
  const range = string && {
    from: string.offset,
    to: isClosed(text, string) ? string.offset + string.length : offset,
  }
  const touchesAfter =
    previous !== undefined &&
    isString &&
    !string &&
    isClosed(text, previous) &&
    offset === previous.offset + previous.length
  const touchesBefore = !string && text[offset] === '"'
  return {
    string,
    range,
    word: wordAround(text, offset),
    touching: touchesAfter || touchesBefore,
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
  // Clé existante renommée : les deux-points sont déjà là, on ne les ajoute pas une seconde fois.
  const end = ctx.range?.to ?? ctx.word.to
  const colonFollows = text.slice(end).trimStart().startsWith(':')
  return Object.entries(parent.properties)
    .filter(([key]) => !present.has(key))
    .map(([key, node]) => ({
      label: key,
      apply: colonFollows ? JSON.stringify(key) : `${JSON.stringify(key)}: `,
      detail: typeLabel(node),
      info: node.description,
    }))
}

const WORD_CHARACTER = /[\w-]/

/** Plage du mot (lettres, chiffres, `_`, `-`) qui entoure `offset`, parcourue caractère par caractère. */
function wordAround(text: string, offset: number): { from: number; to: number } {
  let from = offset
  while (from > 0 && WORD_CHARACTER.test(text.charAt(from - 1))) from -= 1
  let to = offset
  while (to < text.length && WORD_CHARACTER.test(text.charAt(to))) to += 1
  return { from, to }
}

/** Types déclarés d'un nœud, toujours sous forme de tableau. */
function typesOf(node: SchemaNode): readonly string[] {
  if (Array.isArray(node.type)) return node.type
  return node.type === undefined ? [] : [node.type]
}

/** Valeurs littérales proposables, en parcourant récursivement les `anyOf`. */
function collectValues(node: SchemaNode, out: unknown[]): void {
  if (node.enum) out.push(...node.enum)
  if (node.const !== undefined) out.push(node.const)
  const types = typesOf(node)
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
  if (ctx.touching) return undefined
  const options = ctx.isKey ? keyCompletions(text, root, ctx) : valueCompletions(root, ctx.path)
  if (options.length === 0) return undefined
  return {
    from: ctx.range?.from ?? ctx.word.from,
    to: ctx.range?.to ?? ctx.word.to,
    options,
  }
}

/** Description (et défaut) de la propriété dont la clé est sous `offset`. */
export function hoverAt(text: string, offset: number, root: SchemaNode): AssistHover | undefined {
  const ctx = contextAt(text, offset)
  if (!ctx.isKey || !ctx.string || !ctx.range) return undefined
  const node = schemaAt(root, ctx.path)
  if (!node?.description) return undefined
  const hover: AssistHover = {
    from: ctx.range.from,
    to: ctx.range.to,
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
