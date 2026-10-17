import { describe, expect, it } from 'vitest'
import {
  BUNDLE_TARGETS,
  HOME_ROUTE_KEY,
  checkTargets,
  findInitialLeaks,
  findVacuityProblems,
  CODEMIRROR_CHUNK,
  CODEMIRROR_FORBIDDEN,
  CODEMIRROR_IMPORTER,
  SHIKI_CHUNK,
  SHIKI_FORBIDDEN,
  SHIKI_IMPORTER,
  XLSX_CHUNK,
  XLSX_IMPORTER,
  XLSX_FORBIDDEN,
  type ManifestChunk,
} from './check-initial-bundle.ts'

const XLSX_KEY =
  'node_modules/.pnpm/write-excel-file@3.0.0/node_modules/write-excel-file/modules/index.js'

describe('findInitialLeaks', () => {
  it('suit aussi la route d’accueil, chargée aussitôt malgré son découpage paresseux', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, dynamicImports: [HOME_ROUTE_KEY] },
      [HOME_ROUTE_KEY]: { file: 'assets/routes.js', isDynamicEntry: true, imports: ['_xlsx-a.js'] },
      '_xlsx-a.js': { file: 'assets/xlsx-a.js' },
    }
    expect(findInitialLeaks(manifest, XLSX_FORBIDDEN)).toEqual(['_xlsx-a.js'])
  })

  it('signale un module write-excel-file importé statiquement par l’entrée', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: [XLSX_KEY] },
      [XLSX_KEY]: { file: 'assets/xlsx.js' },
    }
    expect(findInitialLeaks(manifest, XLSX_FORBIDDEN)).toEqual([XLSX_KEY])
  })

  it('accepte xlsx atteint seulement par import dynamique', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, dynamicImports: ['src/export.tsx'] },
      'src/export.tsx': {
        file: 'assets/write-workbook.js',
        isDynamicEntry: true,
        imports: [XLSX_KEY],
      },
      [XLSX_KEY]: { file: 'assets/xlsx.js' },
    }
    expect(findInitialLeaks(manifest, XLSX_FORBIDDEN)).toEqual([])
  })

  it('détecte une fuite indirecte (entrée, a.js, write-excel-file)', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_a.js'] },
      '_a.js': { file: 'assets/a.js', imports: [XLSX_KEY] },
      [XLSX_KEY]: { file: 'assets/xlsx.js' },
    }
    expect(findInitialLeaks(manifest, XLSX_FORBIDDEN)).toEqual([XLSX_KEY])
  })

  it('signale un module de lib/xlsx et supporte les cycles', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_a.js'] },
      '_a.js': { file: 'assets/a.js', imports: ['_a.js', 'src/lib/xlsx/write-workbook.ts'] },
      'src/lib/xlsx/write-workbook.ts': { file: 'assets/writer.js' },
    }
    expect(findInitialLeaks(manifest, XLSX_FORBIDDEN)).toEqual(['src/lib/xlsx/write-workbook.ts'])
  })

  it('renvoie [] quand rien n’est interdit', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true },
    }
    expect(findInitialLeaks(manifest, XLSX_FORBIDDEN)).toEqual([])
  })

  it('le motif réel reconnaît le chunk xlsx du manifeste Vite', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_xlsx-CK6PldPx.js'] },
      '_xlsx-CK6PldPx.js': { file: 'assets/xlsx-CK6PldPx.js' },
    }
    expect(findInitialLeaks(manifest, XLSX_FORBIDDEN)).toEqual(['_xlsx-CK6PldPx.js'])
  })
})

/** Extrait réaliste du manifeste de `pnpm build` (F16). */
const REAL_MANIFEST: Record<string, ManifestChunk> = {
  'index.html': {
    file: 'assets/index.js',
    isEntry: true,
    imports: ['_vendor-DqVrg90E.js'],
    dynamicImports: [XLSX_IMPORTER],
  },
  '_vendor-DqVrg90E.js': { file: 'assets/vendor-DqVrg90E.js' },
  [XLSX_IMPORTER]: {
    file: 'assets/write-workbook.js',
    isDynamicEntry: true,
    imports: ['_vendor-DqVrg90E.js', 'index.html', '_xlsx-DtnHr0lg.js'],
  },
  '_xlsx-DtnHr0lg.js': {
    file: 'assets/xlsx-DtnHr0lg.js',
    imports: ['_vendor-DqVrg90E.js'],
  },
}

describe('findVacuityProblems', () => {
  it('passe sur un manifeste réaliste (xlsx atteint par l’écriture du classeur)', () => {
    expect(findVacuityProblems(REAL_MANIFEST, XLSX_CHUNK, XLSX_IMPORTER)).toEqual([])
    expect(findInitialLeaks(REAL_MANIFEST, XLSX_FORBIDDEN)).toEqual([])
  })

  it('échoue sans chunk xlsx dans le manifeste', () => {
    const manifest = { ...REAL_MANIFEST }
    delete manifest['_xlsx-DtnHr0lg.js']
    manifest[XLSX_IMPORTER] = { file: 'assets/write-workbook.js', isDynamicEntry: true }
    const problems = findVacuityProblems(manifest, XLSX_CHUNK, XLSX_IMPORTER)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/aucun chunk/)
  })

  it('échoue quand l’écriture du classeur n’atteint pas le chunk xlsx', () => {
    const manifest: Record<string, ManifestChunk> = {
      ...REAL_MANIFEST,
      [XLSX_IMPORTER]: {
        file: 'assets/write-workbook.js',
        isDynamicEntry: true,
        imports: ['index.html'],
      },
    }
    expect(findVacuityProblems(manifest, XLSX_CHUNK, XLSX_IMPORTER)[0]).toMatch(
      /n'importe pas statiquement _xlsx-DtnHr0lg\.js/,
    )
  })

  it('suit les imports indirects et échoue si la route disparaît', () => {
    const indirect: Record<string, ManifestChunk> = {
      ...REAL_MANIFEST,
      [XLSX_IMPORTER]: { file: 'assets/write-workbook.js', imports: ['_writer.js'] },
      '_writer.js': { file: 'assets/writer.js', imports: ['_xlsx-DtnHr0lg.js'] },
    }
    expect(findVacuityProblems(indirect, XLSX_CHUNK, XLSX_IMPORTER)).toEqual([])
    const withoutRoute = { ...REAL_MANIFEST }
    delete withoutRoute[XLSX_IMPORTER]
    expect(findVacuityProblems(withoutRoute, XLSX_CHUNK, XLSX_IMPORTER)[0]).toMatch(/absente/)
  })
})

const PYTHON_KEY =
  'node_modules/.pnpm/@shikijs+langs@4.4.3/node_modules/@shikijs/langs/dist/python.mjs'

/** Manifeste aux trois cibles : xlsx (écriture du classeur), Shiki (validateur) et CodeMirror (éditeur). */
const ALL_TARGETS: Record<string, ManifestChunk> = {
  'index.html': {
    file: 'assets/index.js',
    isEntry: true,
    imports: ['_vendor-DqVrg90E.js'],
    dynamicImports: [XLSX_IMPORTER, CODEMIRROR_IMPORTER],
  },
  '_vendor-DqVrg90E.js': { file: 'assets/vendor-DqVrg90E.js' },
  [CODEMIRROR_IMPORTER]: {
    file: 'assets/editor-Cm1.js',
    isDynamicEntry: true,
    imports: ['_vendor-DqVrg90E.js', '_codemirror-Xy12Zw34.js'],
  },
  '_codemirror-Xy12Zw34.js': { file: 'assets/codemirror-Xy12Zw34.js' },
  [XLSX_IMPORTER]: {
    file: 'assets/write-workbook.js',
    isDynamicEntry: true,
    imports: ['_vendor-DqVrg90E.js', '_xlsx-Ab12Cd34.js'],
  },
  '_xlsx-Ab12Cd34.js': { file: 'assets/xlsx-Ab12Cd34.js' },
  [SHIKI_IMPORTER]: {
    file: 'assets/code-languages.js',
    isDynamicEntry: true,
    imports: ['_vendor-DqVrg90E.js', '_langs-WOor098P.js'],
  },
  '_langs-WOor098P.js': { file: 'assets/langs-WOor098P.js', dynamicImports: [PYTHON_KEY] },
  [PYTHON_KEY]: { file: 'assets/python-Bd1.js', isDynamicEntry: true },
}

const problemsOf = (manifest: Record<string, ManifestChunk>): string[] =>
  checkTargets(manifest, BUNDLE_TARGETS)

describe('cibles multiples', () => {
  it('déclare xlsx, shiki et codemirror (Recharts retiré en F44.8)', () => {
    expect(BUNDLE_TARGETS.map((target) => target.name)).toEqual(['xlsx', 'shiki', 'codemirror'])
    expect(BUNDLE_TARGETS[0]).toMatchObject({ chunk: XLSX_CHUNK, importer: XLSX_IMPORTER })
    expect(BUNDLE_TARGETS[2]).toMatchObject({
      chunk: CODEMIRROR_CHUNK,
      importer: CODEMIRROR_IMPORTER,
    })
  })

  it('signale la vacuité de codemirror quand la route de l’éditeur ne l’atteint plus', () => {
    const manifest = {
      ...ALL_TARGETS,
      [CODEMIRROR_IMPORTER]: { file: 'assets/editor-Cm1.js', isDynamicEntry: true },
    }
    expect(problemsOf(manifest)).toEqual([
      `codemirror : contrôle sans objet, ${CODEMIRROR_IMPORTER} n'importe pas statiquement _codemirror-Xy12Zw34.js`,
    ])
  })

  it('ne trouve aucun problème sur un manifeste propre aux trois cibles', () => {
    expect(problemsOf(ALL_TARGETS)).toEqual([])
  })

  it('signale la vacuité de xlsx quand son chunk est absent', () => {
    const manifest = { ...ALL_TARGETS }
    delete manifest['_xlsx-Ab12Cd34.js']
    manifest[XLSX_IMPORTER] = { file: 'assets/write-workbook.js', isDynamicEntry: true }
    const problems = problemsOf(manifest)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/^xlsx : contrôle sans objet, aucun chunk/)
  })

  it('signale une fuite quand xlsx est atteint statiquement depuis l’entrée', () => {
    const manifest: Record<string, ManifestChunk> = {
      ...ALL_TARGETS,
      'index.html': {
        ...ALL_TARGETS['index.html'],
        imports: ['_vendor-DqVrg90E.js', '_xlsx-Ab12Cd34.js'],
      },
    }
    expect(findInitialLeaks(manifest, XLSX_FORBIDDEN)).toEqual(['_xlsx-Ab12Cd34.js'])
    expect(findInitialLeaks(manifest, CODEMIRROR_FORBIDDEN)).toEqual([])
  })

  it('signale le catalogue Shiki importé statiquement par l’entrée', () => {
    const manifest: Record<string, ManifestChunk> = {
      ...ALL_TARGETS,
      'index.html': {
        ...ALL_TARGETS['index.html'],
        imports: ['_vendor-DqVrg90E.js', '_langs-WOor098P.js'],
      },
    }
    expect(findInitialLeaks(manifest, SHIKI_FORBIDDEN)).toEqual(['_langs-WOor098P.js'])
    expect(problemsOf(manifest)).toContain('shiki fuit dans le bundle initial : _langs-WOor098P.js')
  })

  it('signale une grammaire importée statiquement par l’entrée', () => {
    const manifest: Record<string, ManifestChunk> = {
      ...ALL_TARGETS,
      'index.html': {
        ...ALL_TARGETS['index.html'],
        imports: ['_vendor-DqVrg90E.js', PYTHON_KEY],
      },
    }
    expect(findInitialLeaks(manifest, SHIKI_FORBIDDEN)).toEqual([PYTHON_KEY])
  })

  it('signale la vacuité de shiki quand le catalogue n’est plus atteint par code-languages', () => {
    const manifest: Record<string, ManifestChunk> = {
      ...ALL_TARGETS,
      [SHIKI_IMPORTER]: { file: 'assets/code-languages.js', isDynamicEntry: true },
    }
    expect(findVacuityProblems(manifest, SHIKI_CHUNK, SHIKI_IMPORTER)[0]).toMatch(
      /n'importe pas statiquement _langs-WOor098P\.js/,
    )
  })

  it('accepte le catalogue Shiki émis en entrée dynamique à son chemin de module (F31)', () => {
    const catalogKey = 'node_modules/.pnpm/shiki@4.4.3/node_modules/shiki/dist/langs.mjs'
    const manifest: Record<string, ManifestChunk> = { ...ALL_TARGETS }
    delete manifest['_langs-WOor098P.js']
    manifest[catalogKey] = {
      file: 'assets/langs-DP7UXOK0.js',
      isDynamicEntry: true,
      dynamicImports: [PYTHON_KEY],
    }
    manifest[SHIKI_IMPORTER] = {
      file: 'assets/code-languages.js',
      isDynamicEntry: true,
      imports: [catalogKey],
    }
    expect(problemsOf(manifest)).toEqual([])
    manifest['index.html'] = { ...manifest['index.html'], imports: [catalogKey] }
    expect(problemsOf(manifest)).toEqual([`shiki fuit dans le bundle initial : ${catalogKey}`])
  })

  it('explique la vacuité de shiki par l’inlining du catalogue dans l’entrée', () => {
    const manifest = { ...ALL_TARGETS }
    delete manifest['_langs-WOor098P.js']
    manifest[SHIKI_IMPORTER] = { file: 'assets/code-languages.js', isDynamicEntry: true }
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
