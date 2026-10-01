import { describe, expect, it } from 'vitest'
import {
  CHUNK_BUDGET,
  HOME_ROUTE_KEY,
  ICON_MARKER,
  INITIAL_BUDGET,
  checkBudgets,
  formatKb,
  type BuildFiles,
} from './check-bundle-budget.ts'
import type { ManifestChunk } from './check-initial-bundle.ts'

const KB = 1024
const GRAMMAR_KEY =
  'node_modules/.pnpm/@shikijs+langs@4.4.3/node_modules/@shikijs/langs/dist/cpp.mjs'
const THEME_KEY =
  'node_modules/.pnpm/@shikijs+themes@4.4.3/node_modules/@shikijs/themes/dist/vitesse-dark.mjs'
const ICONS_KEY =
  'node_modules/.pnpm/@tabler+icons-react@3.48.0/node_modules/@tabler/icons-react/dist/esm/icons/index.mjs'

/**
 * Manifeste minimal : entrée + vendor statiques, route d'accueil paresseuse, icônes, une grammaire,
 * un thème, une autre route paresseuse.
 */
function manifest(): Record<string, ManifestChunk> {
  return {
    'index.html': {
      file: 'assets/index-a.js',
      isEntry: true,
      imports: ['_vendor-b.js'],
      css: ['assets/index-c.css'],
      dynamicImports: ['src/routes/editor.tsx', HOME_ROUTE_KEY],
    },
    '_vendor-b.js': { file: 'assets/vendor-b.js' },
    [HOME_ROUTE_KEY]: { file: 'assets/home-h.js', isDynamicEntry: true, imports: ['_vendor-b.js'] },
    'src/routes/editor.tsx': { file: 'assets/editor-d.js', isDynamicEntry: true },
    [ICONS_KEY]: { file: 'assets/icons-e.js', isDynamicEntry: true },
    [GRAMMAR_KEY]: { file: 'assets/cpp-f.js', isDynamicEntry: true },
    [THEME_KEY]: { file: 'assets/vitesse-dark-g.js', isDynamicEntry: true },
  }
}

/** Fichiers du build : tailles gzip en octets, contenu (seul le marqueur d'icônes est lu). */
function files(
  sizes: Record<string, number> = {},
  contents: Record<string, string> = {},
): BuildFiles {
  const base: Record<string, number> = {
    'assets/index-a.js': 50 * KB,
    'assets/vendor-b.js': 60 * KB,
    'assets/index-c.css': 15 * KB,
    'assets/home-h.js': 20 * KB,
    'assets/editor-d.js': 40 * KB,
    'assets/icons-e.js': 430 * KB,
    'assets/cpp-f.js': 200 * KB,
    'assets/vitesse-dark-g.js': 150 * KB,
  }
  const text: Record<string, string> = {
    'assets/icons-e.js': `const ${ICON_MARKER}=1`,
    ...contents,
  }
  const all = { ...base, ...sizes }
  return {
    gzipSize: (file) => {
      const size = all[file]
      if (size === undefined) throw new Error(`taille inconnue : ${file}`)
      return size
    },
    contents: (file) => text[file] ?? '',
  }
}

describe('checkBudgets', () => {
  it('passe sous les budgets et résume les marges', () => {
    const { problems, summary } = checkBudgets(manifest(), files())
    expect(problems).toEqual([])
    expect(summary).toContain('145,0 Ko')
    expect(summary).toContain(formatKb(INITIAL_BUDGET))
  })

  it('compte JS et CSS de l’entrée et de la route d’accueil, pas les autres imports dynamiques', () => {
    // 50 + 60 + 15 + 20 = 145 Ko (vendor compté une fois) ; l'éditeur (40 Ko) n'entre pas.
    const over = INITIAL_BUDGET - 145 * KB + 1
    const { problems } = checkBudgets(manifest(), files({ 'assets/index-c.css': 15 * KB + over }))
    expect(problems).toHaveLength(1)
    // Un octet de trop ne s'affiche pas « +0,0 Ko » : l'écart est arrondi au dixième supérieur.
    expect(problems[0]).toMatch(
      /^premier affichage de l’accueil : .* Ko gzip, budget .* Ko \(\+0,1 Ko\)$/,
    )
  })

  it('un import statique lourd dans l’accueil fait échouer le budget en nommant l’écart', () => {
    const heavy = manifest()
    heavy[HOME_ROUTE_KEY].imports = ['_vendor-b.js', '_lourd-i.js']
    heavy['_lourd-i.js'] = { file: 'assets/lourd-i.js' }
    const total = 145 * KB + 140 * KB
    const { problems } = checkBudgets(heavy, files({ 'assets/lourd-i.js': 140 * KB }))
    expect(problems).toContain(
      `premier affichage de l’accueil : ${formatKb(total)} Ko gzip, budget ${formatKb(INITIAL_BUDGET)} Ko (+${formatKb(total - INITIAL_BUDGET)} Ko)`,
    )
  })

  it('signale un chunk au-delà du budget par chunk, avec son fichier et l’écart', () => {
    const size = CHUNK_BUDGET + 10 * KB
    const { problems } = checkBudgets(manifest(), files({ 'assets/editor-d.js': size }))
    expect(problems).toEqual([
      `assets/editor-d.js : ${formatKb(size)} Ko gzip, budget ${formatKb(CHUNK_BUDGET)} Ko (+10,0 Ko)`,
    ])
  })

  it('n’exempte un fichier que si toutes ses clés sont des grammaires ou thèmes Shiki', () => {
    const mixed = manifest()
    mixed['src/app-code.ts'] = { file: 'assets/cpp-f.js' }
    const { problems } = checkBudgets(mixed, files({ 'assets/cpp-f.js': CHUNK_BUDGET + KB }))
    expect(problems).toEqual([
      `assets/cpp-f.js : ${formatKb(CHUNK_BUDGET + KB)} Ko gzip, budget ${formatKb(CHUNK_BUDGET)} Ko (+1,0 Ko)`,
    ])
  })

  it('soumet au budget un chunk de node_modules hors grammaires et thèmes (moteur Shiki)', () => {
    const engine = manifest()
    engine['node_modules/.pnpm/shiki@4.4.3/node_modules/shiki/dist/core.mjs'] = {
      file: 'assets/core-j.js',
    }
    const size = CHUNK_BUDGET + 2 * KB
    expect(checkBudgets(engine, files({ 'assets/core-j.js': size })).problems).toHaveLength(1)
  })

  it('exempte du budget par chunk les icônes, les grammaires et les thèmes Shiki', () => {
    const { problems } = checkBudgets(
      manifest(),
      files({ 'assets/icons-e.js': 900 * KB, 'assets/cpp-f.js': 900 * KB }),
    )
    expect(problems).toEqual([])
  })

  it('signale le marqueur d’icônes hors du chunk des icônes', () => {
    const { problems } = checkBudgets(
      manifest(),
      files({}, { 'assets/editor-d.js': `x.displayName="${ICON_MARKER}"` }),
    )
    expect(problems).toEqual([`${ICON_MARKER} hors du chunk des icônes : assets/editor-d.js`])
  })

  it('garde de vacuité : sans entrée, sans chunk d’icônes marqué, sans grammaire exemptée', () => {
    const empty = checkBudgets({}, files())
    expect(empty.problems).toContain('aucune entrée isEntry dans le manifeste')
    expect(empty.problems).toContain(
      `route ${HOME_ROUTE_KEY} absente du manifeste (route renommée ?)`,
    )

    const noIcons = manifest()
    delete noIcons[ICONS_KEY]
    expect(checkBudgets(noIcons, files()).problems).toContain(
      'aucun chunk icons-* dans le manifeste (groupe des icônes renommé ?)',
    )

    const unmarked = checkBudgets(manifest(), files({}, { 'assets/icons-e.js': 'rien' }))
    expect(unmarked.problems).toContain(
      `${ICON_MARKER} absent du chunk des icônes : marqueur à mettre à jour`,
    )

    const noGrammar = manifest()
    delete noGrammar[GRAMMAR_KEY]
    delete noGrammar[THEME_KEY]
    expect(checkBudgets(noGrammar, files()).problems).toContain(
      'aucune grammaire ni thème Shiki exemptés (chemin @shikijs changé ?)',
    )
  })

  it('compte une seule fois un fichier partagé par plusieurs clés', () => {
    const shared = manifest()
    shared['index.html'].imports = ['_vendor-b.js', 'src/again.ts']
    shared['src/again.ts'] = { file: 'assets/vendor-b.js' }
    expect(checkBudgets(shared, files()).summary).toContain('145,0 Ko')
  })
})

describe('formatKb', () => {
  it('formate en Ko à une décimale, virgule française', () => {
    expect(formatKb(1536)).toBe('1,5')
  })
})
