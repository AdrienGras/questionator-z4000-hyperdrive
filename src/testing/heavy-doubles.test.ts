import { expect, test } from 'vitest'

/**
 * Garde-fou de la convention « test qui rend une config avec icônes ou blocs de code »
 * (CONVENTIONS, #87, #88) : un test d'écran qui rend la config d'exemple, ou l'éditeur qui part de
 * l'exemple, double l'index des icônes Tabler et `highlight`. Sinon chaque fichier recharge des
 * milliers de modules d'icônes et la grammaire PHP, et frôle le délai de 5 s sous la suite.
 * Vérification textuelle des sources : un `.test.ts` (sans rendu) n'est pas concerné.
 */
const SOURCES = import.meta.glob<string>('/src/**/*.test.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** Indices qu'un test rend la config d'exemple. */
const RENDERS_EXAMPLE = [/config\.example\.json/, /<ConfigEditorPage\b/]

const REQUIRED_DOUBLES = [
  "vi.mock('@tabler/icons-react/dist/esm/icons/index.mjs'",
  "vi.mock('@/lib/markdown/highlighter'",
]

test('les sources de test sont bien lues', () => {
  expect(Object.keys(SOURCES).length).toBeGreaterThan(50)
})

test('un test d’écran qui rend la config d’exemple double les icônes et la coloration', () => {
  const missing = Object.entries(SOURCES)
    .filter(([, source]) => RENDERS_EXAMPLE.some((pattern) => pattern.test(source)))
    .flatMap(([path, source]) =>
      REQUIRED_DOUBLES.filter((double) => !source.includes(double)).map(
        (double) => `${path} : ${double})`,
      ),
    )
  expect(missing).toEqual([])
})
