import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Ce fichier tourne aussi pour les tests `@vitest-environment node` (ex. vite/*.test.ts),
// où `window` n'existe pas.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
  // jsdom annonce en-US : l'interface suit la langue du navigateur (D51), les tests l'attendent en fr.
  Object.defineProperty(window.navigator, 'languages', { value: ['fr-FR'], configurable: true })
}

afterEach(() => {
  cleanup()
})
