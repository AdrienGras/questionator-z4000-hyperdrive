import { defineConfig, devices } from '@playwright/test'
import { baseURL, webServer } from './playwright.config.ts'

/**
 * Captures du guide utilisateur (F28) : `pnpm docs:screenshots` régénère `site/public/screenshots/`.
 * Rendu figé (viewport, densité, thème, locale, fuseau) ; l'aléa et l'horloge le sont dans `determinism.ts`.
 */
export default defineConfig({
  testDir: 'e2e/screenshots',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    // Sans service worker : pas de mise à jour de l'app ni de bandeau parasite dans les captures.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer,
})
