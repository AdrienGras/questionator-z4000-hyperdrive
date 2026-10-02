import { defineConfig, devices } from '@playwright/test'

/** Tests de bout en bout (F14, D33) : Chromium seul, contre le build de production servi par `vite preview`. */
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173/questionator-z4000-hyperdrive/',
    // Locale figée : l'accueil s'affiche en français quel que soit le poste, les libellés sont déterministes.
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // `exec` sur le binaire de vite : Playwright arrête alors bien le serveur (via `pnpm preview`, il restait orphelin).
    // La doc est construite après l'app : `pnpm build` vide `dist/`, `docs:build` écrit dans `dist/docs/`.
    command:
      'pnpm build && pnpm docs:build && exec node_modules/.bin/vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/questionator-z4000-hyperdrive/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
