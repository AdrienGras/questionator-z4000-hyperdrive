import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Ce fichier tourne aussi pour les tests `@vitest-environment node` (ex. vite/*.test.ts),
// où `window` n'existe pas.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
}

afterEach(() => {
  cleanup()
})
