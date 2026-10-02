import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults, defineConfig } from 'vitest/config'
import { configSchemaPlugin } from './vite/config-schema-plugin.ts'
import { DOCS_NAVIGATION_DENYLIST } from './vite/docs-navigation-denylist.ts'

/** Lit la version de `package.json` sans passer par un cast (oxlint `no-unsafe-type-assertion`). */
function readPackageVersion(): string {
  const parsed: unknown = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
  )
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    typeof parsed.version !== 'string'
  ) {
    throw new Error('package.json doit contenir un champ "version" de type string.')
  }
  return parsed.version
}

/** Violet nuit du fond de l'icône (D72) : littéral répété dans `index.html` et `public/icons/icon.svg`. */
const NIGHT = '#1a1033'

export default defineConfig({
  base: '/questionator-z4000-hyperdrive/',
  define: { __APP_VERSION__: JSON.stringify(readPackageVersion()) },
  build: {
    // Manifeste lu par `scripts/check-initial-bundle.ts` (Recharts et xlsx hors du bundle initial, D70/D71).
    manifest: true,
    // Limite GLOBALE (Vite l'applique à tous les chunks, pas seulement à celui-ci) : elle coupe
    // l'avertissement pour n'importe quel chunk jusqu'à 2,4 Mo. Elle est fixée ici pour couvrir le
    // seul chunk censé dépasser 500 kB, celui des icônes Tabler (chargé à la demande par
    // `createIconLoader`, F07 tâche 5, import profond `@tabler/icons-react/dist/esm/icons/index.mjs`
    // pour l'isoler du bundle initial, F07 tâche 6), qui pèse ~2,37 Mo minifiés (D37, mesuré à
    // 2 370,47 kB ; valeur fixée juste au-dessus). Effet de bord accepté : le budget des AUTRES
    // chunks n'est donc plus surveillé par Vite en dessous de 2,4 Mo (voir docs/BACKLOG.md).
    chunkSizeWarningLimit: 2400,
    // Isole Recharts (et ses d3) dans un chunk nommé `recharts` : sans cela Rolldown l'inline dans le
    // chunk qui l'importe et le manifeste ne le voit plus, donc `check:bundle` ne saurait pas
    // détecter une fuite dans le bundle initial (D70).
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Socle partagé par l'application ET par Recharts (React, son runtime, `clsx`,
            // `tiny-invariant`, `use-sync-external-store`). Cause : `includeDependenciesRecursively`
            // vaut `true` par défaut, donc le groupe `recharts` avale aussi les dépendances qu'il
            // partage avec l'appli ; sans ce groupe, React finit dans `_recharts-*` et l'entrée
            // l'importe statiquement. Variante tentante écartée : `{ test: /node_modules[\\/]/,
            // tags: ['$initial'] }` absorberait un Recharts qui fuit dans `vendor` et aveuglerait
            // `check:bundle`. La liste blanche échoue du bon côté : si elle dérive, la CI rougit ;
            // la compléter quand `check:bundle` signale une fuite.
            {
              name: 'vendor',
              test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:react|react-dom|scheduler|clsx|tiny-invariant|use-sync-external-store)[\\/]/,
            },
            {
              name: 'recharts',
              test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:recharts|victory-vendor|d3-[^\\/]+)[\\/]/,
            },
            // Écriture xlsx (F16, D71) : `write-excel-file` et `fflate`, chargés en `import()` dynamique
            // depuis `src/lib/xlsx/write-workbook.ts`. Même raison que `recharts` : sans groupe nommé,
            // Rolldown l'inline dans le chunk appelant et `check:bundle` ne le voit plus.
            {
              name: 'xlsx',
              test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:write-excel-file|fflate)[\\/]/,
            },
            // Éditeur JSON (F26) : CodeMirror et ses dépendances Lezer, chargés à la demande avec
            // l'éditeur. Même raison que `recharts` : sans groupe nommé, Rolldown l'inline dans le
            // chunk appelant et `check:bundle` ne le voit plus.
            {
              name: 'codemirror',
              test: /node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:@codemirror|@lezer|style-mod|w3c-keyname|crelt|@marijn)[\\/]/,
            },
          ],
        },
      },
    },
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: String.raw`\.test\.tsx?$`,
    }),
    react(),
    tailwindcss(),
    configSchemaPlugin(),
    // PWA hors ligne (F17, D72). Mode `prompt` : le nouveau service worker attend que l'utilisateur
    // accepte la mise à jour (`src/lib/pwa/pwa-update.ts`) ; l'enregistrement est fait à la main par
    // `src/main.tsx`, en prod seulement. `scope` et `start_url` héritent de `base`.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      devOptions: { enabled: false },
      manifest: {
        name: 'Questionator Z-4000 Hyperdrive',
        short_name: 'Questionator',
        description: 'Faire passer des oraux notés par tirage de questions.',
        lang: 'fr',
        display: 'standalone',
        theme_color: NIGHT,
        background_color: NIGHT,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Tout ce que le build émet, chunks à la demande compris (Shiki, Tabler, Recharts, xlsx),
        // polices Geist et fichiers de `configSchemaPlugin`. `dist/.vite/` (caché) reste dehors.
        globPatterns: ['**/*.{js,css,html,json,csv,svg,png,webp,woff2}'],
        // La doc VitePress (`dist/docs/`, F27, D96) n'est pas pré-cachée : elle se consulte en ligne.
        globIgnores: ['docs/**'],
        // Repli de navigation : sans cette exclusion, le SW servirait l'app (index.html) à la place
        // de la doc sur les URL `/docs…`.
        navigateFallbackDenylist: [DOCS_NAVIGATION_DENYLIST],
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Plafond par fichier (défaut Workbox : 2 Mio), fixé juste au-dessus du plus gros fichier du
        // build, le chunk des icônes Tabler (D37, mesuré à 2 368,52 kB), comme `chunkSizeWarningLimit`.
        // Au-delà, Workbox l'exclurait du pré-cache (« will not be precached ») et le choix d'une
        // icône casserait hors ligne.
        maximumFileSizeToCacheInBytes: 2_400_000,
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    // Défaut Vitest : un worker par cœur moins un (15 sur 16). Chaque fichier y recrée jsdom et
    // réévalue son graphe de modules : la suite sature le CPU, et le premier rendu d'un écran
    // routé (~0,8 s seul) frôle le délai de 5 s dès que la machine porte une autre charge (#87 :
    // 5 suites sur 10 en échec, 8 cœurs occupés). À 75 % : même durée machine libre, 0 sur 10
    // dans les mêmes conditions. Sur 4 cœurs (CI), 75 % donne 3 workers, comme le défaut.
    maxWorkers: '75%',
    // Les specs Playwright (`pnpm e2e`) ne sont pas des tests Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Sans cela, `import css from '../index.css?raw'` renvoie '' sous Vitest (test des THEME_TOKENS).
    css: { include: [/index\.css/] },
  },
})
