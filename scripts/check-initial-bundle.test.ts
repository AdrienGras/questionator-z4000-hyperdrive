import { describe, expect, it } from 'vitest'
import {
  findInitialLeaks,
  findVacuityProblems,
  FORBIDDEN,
  RECHARTS_CHUNK,
  STATS_ROUTE_KEY,
  type ManifestChunk,
} from './check-initial-bundle.ts'

const RECHARTS_KEY = 'node_modules/.pnpm/recharts@3.8.0/node_modules/recharts/es6/index.js'

describe('findInitialLeaks', () => {
  it('signale un module recharts importé statiquement par l’entrée', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: [RECHARTS_KEY] },
      [RECHARTS_KEY]: { file: 'assets/recharts.js' },
    }
    expect(findInitialLeaks(manifest, FORBIDDEN)).toEqual([RECHARTS_KEY])
  })

  it('accepte recharts atteint seulement par import dynamique', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, dynamicImports: ['src/stats.tsx'] },
      'src/stats.tsx': { file: 'assets/stats.js', isDynamicEntry: true, imports: [RECHARTS_KEY] },
      [RECHARTS_KEY]: { file: 'assets/recharts.js' },
    }
    expect(findInitialLeaks(manifest, FORBIDDEN)).toEqual([])
  })

  it('détecte une fuite indirecte (entrée, a.js, recharts)', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_a.js'] },
      '_a.js': { file: 'assets/a.js', imports: [RECHARTS_KEY] },
      [RECHARTS_KEY]: { file: 'assets/recharts.js' },
    }
    expect(findInitialLeaks(manifest, FORBIDDEN)).toEqual([RECHARTS_KEY])
  })

  it('signale le chunk de chart.tsx et supporte les cycles', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_a.js'] },
      '_a.js': { file: 'assets/a.js', imports: ['_a.js', 'src/components/ui/chart.tsx'] },
      'src/components/ui/chart.tsx': { file: 'assets/chart.js' },
    }
    expect(findInitialLeaks(manifest, FORBIDDEN)).toEqual(['src/components/ui/chart.tsx'])
  })

  it('renvoie [] quand rien n’est interdit', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true },
    }
    expect(findInitialLeaks(manifest, FORBIDDEN)).toEqual([])
  })

  it('le motif réel reconnaît le chunk recharts du manifeste Vite', () => {
    const manifest: Record<string, ManifestChunk> = {
      'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_recharts-CK6PldPx.js'] },
      '_recharts-CK6PldPx.js': { file: 'assets/recharts-CK6PldPx.js' },
    }
    expect(findInitialLeaks(manifest, FORBIDDEN)).toEqual(['_recharts-CK6PldPx.js'])
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
    expect(findInitialLeaks(REAL_MANIFEST, FORBIDDEN)).toEqual([])
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
