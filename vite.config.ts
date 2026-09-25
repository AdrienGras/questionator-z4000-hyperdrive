import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
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
    // Le chunk séparé des icônes Tabler (chargé à la demande par `createIconLoader`, F07 tâche 5,
    // import profond `@tabler/icons-react/dist/esm/icons/index.mjs` pour l'isoler du bundle
    // initial, F07 tâche 6) pèse ~2,37 Mo minifiés : attendu et accepté par D37, pas un signe de
    // mauvais découpage. Valeur fixée juste au-dessus du poids mesuré (2 370,47 kB) pour garder
    // l'avertissement actif sur un futur chunk qui grossirait pour une autre raison.
    chunkSizeWarningLimit: 2400,
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
    // Sans cela, `import css from '../index.css?raw'` renvoie '' sous Vitest (test des THEME_TOKENS).
    css: { include: [/index\.css/] },
  },
})
