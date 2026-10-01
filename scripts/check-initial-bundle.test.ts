import { describe, expect, it } from 'vitest'
import {
  BUNDLE_TARGETS,
  checkTargets,
  findInitialLeaks,
  findVacuityProblems,
  CODEMIRROR_FORBIDDEN,
  RECHARTS_FORBIDDEN,
  RECHARTS_CHUNK,
  STATS_ROUTE_KEY,
  SHIKI_CHUNK,
  SHIKI_FORBIDDEN,
  SHIKI_IMPORTER,
  XLSX_CHUNK,
  XLSX_IMPORTER,
  XLSX_FORBIDDEN,
  type ManifestChunk,
} from './check-initial-bundle.ts'

const RECHARTS_KEY = 'node_modules/.pnpm/recharts@3.8.0/node_modules/recharts/es6/index.js'

describe('findInitialLeaks', () => {
  it('signale un module recharts importé statiquement par l’entrée', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: [RECHARTS_KEY] },
      [RECHARTS_KEY]: { file: 'assets/recharts.js' },
    }
    expect(findInitialLeaks(manifest, RECHARTS_FORBIDDEN)).toEqual([RECHARTS_KEY])
  })

  it('accepte recharts atteint seulement par import dynamique', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, dynamicImports: ['src/stats.tsx'] },
      'src/stats.tsx': { file: 'assets/stats.js', isDynamicEntry: true, imports: [RECHARTS_KEY] },
      [RECHARTS_KEY]: { file: 'assets/recharts.js' },
    }
    expect(findInitialLeaks(manifest, RECHARTS_FORBIDDEN)).toEqual([])
  })

  it('détecte une fuite indirecte (entrée, a.js, recharts)', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_a.js'] },
      '_a.js': { file: 'assets/a.js', imports: [RECHARTS_KEY] },
      [RECHARTS_KEY]: { file: 'assets/recharts.js' },
    }
    expect(findInitialLeaks(manifest, RECHARTS_FORBIDDEN)).toEqual([RECHARTS_KEY])
  })

  it('signale le chunk de chart.tsx et supporte les cycles', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_a.js'] },
      '_a.js': { file: 'assets/a.js', imports: ['_a.js', 'src/components/ui/chart.tsx'] },
      'src/components/ui/chart.tsx': { file: 'assets/chart.js' },
    }
    expect(findInitialLeaks(manifest, RECHARTS_FORBIDDEN)).toEqual(['src/components/ui/chart.tsx'])
  })

  it('renvoie [] quand rien n’est interdit', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true },
    }
    expect(findInitialLeaks(manifest, RECHARTS_FORBIDDEN)).toEqual([])
  })

  it('le motif réel reconnaît le chunk recharts du manifeste Vite', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_recharts-CK6PldPx.js'] },
      '_recharts-CK6PldPx.js': { file: 'assets/recharts-CK6PldPx.js' },
    }
    expect(findInitialLeaks(manifest, RECHARTS_FORBIDDEN)).toEqual(['_recharts-CK6PldPx.js'])
  })
})

/** Extrait réaliste du manifeste de `pnpm build` (F15). */
const REAL_MANIFEST: Record<string, ManifestChunk> = {
  'index.html': {
    file: 'assets/index.js',
    isEntry: true,
    imports: ['_vendor-DqVrg90E.js'],
    dynamicImports: [STATS_ROUTE_KEY],
  },
  '_vendor-DqVrg90E.js': { file: 'assets/vendor-DqVrg90E.js' },
  [STATS_ROUTE_KEY]: {
    file: 'assets/session._sessionId_.stats.js',
    isDynamicEntry: true,
    imports: ['_vendor-DqVrg90E.js', 'index.html', '_recharts-DtnHr0lg.js'],
  },
  '_recharts-DtnHr0lg.js': {
    file: 'assets/recharts-DtnHr0lg.js',
    imports: ['_vendor-DqVrg90E.js'],
  },
}

describe('findVacuityProblems', () => {
  it('passe sur un manifeste réaliste (recharts atteint par la route des stats)', () => {
    expect(findVacuityProblems(REAL_MANIFEST, RECHARTS_CHUNK, STATS_ROUTE_KEY)).toEqual([])
    expect(findInitialLeaks(REAL_MANIFEST, RECHARTS_FORBIDDEN)).toEqual([])
  })

  it('échoue sans chunk recharts dans le manifeste', () => {
    const manifest = { ...REAL_MANIFEST }
    delete manifest['_recharts-DtnHr0lg.js']
    manifest[STATS_ROUTE_KEY] = { file: 'assets/stats.js', isDynamicEntry: true }
    const problems = findVacuityProblems(manifest, RECHARTS_CHUNK, STATS_ROUTE_KEY)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/aucun chunk/)
  })

  it('échoue quand la route des stats n’atteint pas le chunk recharts', () => {
    const manifest: Record<string, ManifestChunk> = {
      ...REAL_MANIFEST,
      [STATS_ROUTE_KEY]: { file: 'assets/stats.js', isDynamicEntry: true, imports: ['index.html'] },
    }
    expect(findVacuityProblems(manifest, RECHARTS_CHUNK, STATS_ROUTE_KEY)[0]).toMatch(
      /n'importe pas statiquement _recharts-DtnHr0lg\.js/,
    )
  })

  it('suit les imports indirects et échoue si la route disparaît', () => {
    const indirect: Record<string, ManifestChunk> = {
      ...REAL_MANIFEST,
      [STATS_ROUTE_KEY]: { file: 'assets/stats.js', imports: ['_chart.js'] },
      '_chart.js': { file: 'assets/chart.js', imports: ['_recharts-DtnHr0lg.js'] },
    }
    expect(findVacuityProblems(indirect, RECHARTS_CHUNK, STATS_ROUTE_KEY)).toEqual([])
    const withoutRoute = { ...REAL_MANIFEST }
    delete withoutRoute[STATS_ROUTE_KEY]
    expect(findVacuityProblems(withoutRoute, RECHARTS_CHUNK, STATS_ROUTE_KEY)[0]).toMatch(/absente/)
  })
})

const PYTHON_KEY =
  'node_modules/.pnpm/@shikijs+langs@4.4.3/node_modules/@shikijs/langs/dist/python.mjs'

/** Manifeste à trois cibles : Recharts (route des stats), xlsx (écriture du classeur) et Shiki (validateur). */
const THREE_TARGETS: Record<string, ManifestChunk> = {
  ...REAL_MANIFEST,
  'index.html': {
    ...REAL_MANIFEST['index.html'],
    dynamicImports: [STATS_ROUTE_KEY, XLSX_IMPORTER],
  },
  [XLSX_IMPORTER]: {
    file: 'assets/write-workbook.js',
    isDynamicEntry: true,
    imports: ['_vendor-DqVrg90E.js', '_xlsx-Ab12Cd34.js'],
  },
  '_xlsx-Ab12Cd34.js': { file: 'assets/xlsx-Ab12Cd34.js' },
  [SHIKI_IMPORTER]: {
    file: 'assets/validate.js',
    isDynamicEntry: true,
    imports: ['_vendor-DqVrg90E.js', '_langs-WOor098P.js'],
  },
  '_langs-WOor098P.js': { file: 'assets/langs-WOor098P.js', dynamicImports: [PYTHON_KEY] },
  [PYTHON_KEY]: { file: 'assets/python-Bd1.js', isDynamicEntry: true },
}

const problemsOf = (manifest: Record<string, ManifestChunk>): string[] =>
  checkTargets(manifest, BUNDLE_TARGETS)

describe('cibles multiples', () => {
  it('déclare recharts, xlsx, shiki et codemirror', () => {
    expect(BUNDLE_TARGETS.map((target) => target.name)).toEqual([
      'recharts',
      'xlsx',
      'shiki',
      'codemirror',
    ])
    expect(BUNDLE_TARGETS[1]).toMatchObject({ chunk: XLSX_CHUNK, importer: XLSX_IMPORTER })
  })

  it('ne trouve aucun problème sur un manifeste propre aux trois cibles', () => {
    expect(problemsOf(THREE_TARGETS)).toEqual([])
  })

  it('signale la vacuité de xlsx quand son chunk est absent', () => {
    const manifest = { ...THREE_TARGETS }
    delete manifest['_xlsx-Ab12Cd34.js']
    manifest[XLSX_IMPORTER] = { file: 'assets/write-workbook.js', isDynamicEntry: true }
    const problems = problemsOf(manifest)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/^xlsx : contrôle sans objet, aucun chunk/)
  })

  it('signale une fuite quand xlsx est atteint statiquement depuis l’entrée', () => {
    const manifest: Record<string, ManifestChunk> = {
      ...THREE_TARGETS,
      'index.html': {
        ...THREE_TARGETS['index.html'],
        imports: ['_vendor-DqVrg90E.js', '_xlsx-Ab12Cd34.js'],
      },
    }
    expect(findInitialLeaks(manifest, XLSX_FORBIDDEN)).toEqual(['_xlsx-Ab12Cd34.js'])
    expect(findInitialLeaks(manifest, RECHARTS_FORBIDDEN)).toEqual([])
  })

  it('signale le catalogue Shiki importé statiquement par l’entrée', () => {
    const manifest: Record<string, ManifestChunk> = {
      ...THREE_TARGETS,
      'index.html': {
        ...THREE_TARGETS['index.html'],
        imports: ['_vendor-DqVrg90E.js', '_langs-WOor098P.js'],
      },
    }
    expect(findInitialLeaks(manifest, SHIKI_FORBIDDEN)).toEqual(['_langs-WOor098P.js'])
    expect(problemsOf(manifest)).toContain('shiki fuit dans le bundle initial : _langs-WOor098P.js')
  })

  it('signale une grammaire importée statiquement par l’entrée', () => {
    const manifest: Record<string, ManifestChunk> = {
      ...THREE_TARGETS,
      'index.html': {
        ...THREE_TARGETS['index.html'],
        imports: ['_vendor-DqVrg90E.js', PYTHON_KEY],
      },
    }
    expect(findInitialLeaks(manifest, SHIKI_FORBIDDEN)).toEqual([PYTHON_KEY])
  })

  it('signale la vacuité de shiki quand le catalogue n’est plus atteint par le validateur', () => {
    const manifest: Record<string, ManifestChunk> = {
      ...THREE_TARGETS,
      [SHIKI_IMPORTER]: { file: 'assets/validate.js', isDynamicEntry: true },
    }
    expect(findVacuityProblems(manifest, SHIKI_CHUNK, SHIKI_IMPORTER)[0]).toMatch(
      /n'importe pas statiquement _langs-WOor098P\.js/,
    )
  })

  it('explique la vacuité de shiki par l’inlining du catalogue dans l’entrée', () => {
    const manifest = { ...THREE_TARGETS }
    delete manifest['_langs-WOor098P.js']
    manifest[SHIKI_IMPORTER] = { file: 'assets/validate.js', isDynamicEntry: true }
    expect(problemsOf(manifest)).toEqual([
      expect.stringMatching(
        /^shiki : contrôle sans objet, aucun chunk .*import statique de `shiki\/langs`/,
      ),
    ])
  })
})

describe('codemirror', () => {
  const STATE_KEY =
    'node_modules/.pnpm/@codemirror+state@6.7.6/node_modules/@codemirror/state/dist/index.js'
  const LEZER_KEY =
    'node_modules/.pnpm/@lezer+highlight@1.2.5/node_modules/@lezer/highlight/dist/index.js'

  it('signale un module @codemirror ou @lezer importé statiquement par l’entrée', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: [STATE_KEY, LEZER_KEY] },
      [STATE_KEY]: { file: 'assets/state.js' },
      [LEZER_KEY]: { file: 'assets/lezer.js' },
    }
    expect(findInitialLeaks(manifest, CODEMIRROR_FORBIDDEN)).toEqual([STATE_KEY, LEZER_KEY])
  })

  it('accepte CodeMirror atteint seulement par import dynamique', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, dynamicImports: [STATE_KEY] },
      [STATE_KEY]: { file: 'assets/state.js', isDynamicEntry: true },
    }
    expect(findInitialLeaks(manifest, CODEMIRROR_FORBIDDEN)).toEqual([])
  })
})
