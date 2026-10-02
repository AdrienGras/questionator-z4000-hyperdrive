/** Sous-ensemble d'un nœud de JSON Schema utile aux valeurs littérales. */
export type SchemaValueNode = {
  type?: string | string[]
  enum?: unknown[]
  const?: unknown
  anyOf?: SchemaValueNode[]
}

/** Recherche des icônes Tabler, proposée pour la seule liste ouverte du schéma (`icon`, F40). */
export const TABLER_ICONS_URL = 'https://tabler.io/icons'

/** Types déclarés d'un nœud, toujours sous forme de tableau. */
function typesOf(node: SchemaValueNode): readonly string[] {
  if (Array.isArray(node.type)) return node.type
  return node.type === undefined ? [] : [node.type]
}

/** Valeurs littérales d'un nœud, en parcourant récursivement les `anyOf` (autocomplétion, survol). */
export function collectValues(node: SchemaValueNode, out: unknown[]): void {
  if (node.enum) out.push(...node.enum)
  if (node.const !== undefined) out.push(node.const)
  const types = typesOf(node)
  if (types.includes('boolean')) out.push(true, false)
  if (types.includes('null')) out.push(null)
  for (const branch of node.anyOf ?? []) collectValues(branch, out)
}

/** Une branche `anyOf` qui accepte n'importe quelle chaîne : la liste de valeurs est indicative. */
function acceptsFreeString(node: SchemaValueNode): boolean {
  return (node.anyOf ?? []).some(
    (branch) =>
      typesOf(branch).includes('string') && branch.enum === undefined && branch.const === undefined,
  )
}

/**
 * Valeurs à montrer au survol d'une clé (F40) : littéraux JSON d'une liste fermée, `open` pour un
 * `anyOf` qui accepte aussi une chaîne libre (des milliers de noms d'icônes : pas de liste), ou
 * `undefined` s'il n'y a rien d'utile à montrer (booléen, nombre ou chaîne libres).
 */
export function hoverValues(
  node: SchemaValueNode,
): { kind: 'closed'; values: string[] } | { kind: 'open' } | undefined {
  if (acceptsFreeString(node)) return { kind: 'open' }
  const collected: unknown[] = []
  collectValues(node, collected)
  const literals = collected
    .filter((value) => typeof value !== 'boolean')
    .map((value) => JSON.stringify(value))
  const values = [...new Set(literals)]
  return values.length === 0 ? undefined : { kind: 'closed', values }
}
