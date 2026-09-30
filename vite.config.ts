import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'
import { configSchemaPlugin } from './vite/config-schema-plugin.ts'

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

export default defineConfig({
  base: '/questionator-z4000-hyperdrive/',
  define: { __APP_VERSION__: JSON.stringify(readPackageVersion()) },
  build: {
    // Manifeste lu par `scripts/check-initial-bundle.ts` (Recharts hors du bundle initial, D70).
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
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    // Les specs Playwright (`pnpm e2e`) ne sont pas des tests Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Sans cela, `import css from '../index.css?raw'` renvoie '' sous Vitest (test des THEME_TOKENS).
    css: { include: [/index\.css/] },
  },
})
