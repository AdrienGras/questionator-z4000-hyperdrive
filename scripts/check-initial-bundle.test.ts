import { describe, expect, it } from 'vitest'
import {
  findInitialLeaks,
  FORBIDDEN as BUNDLE_FORBIDDEN,
  type ManifestChunk,
} from './check-initial-bundle.ts'

const FORBIDDEN = /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?recharts\//

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
    expect(findInitialLeaks(manifest, /src\/components\/ui\/chart\.tsx/)).toEqual([
      'src/components/ui/chart.tsx',
    ])
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
    expect(findInitialLeaks(manifest, BUNDLE_FORBIDDEN)).toEqual(['_recharts-CK6PldPx.js'])
  })
})
