import { fileURLToPath } from 'node:url'
import { test as base } from '@playwright/test'
import { ExaminerPage } from './pages/examiner-page.ts'
import { HomePage } from './pages/home-page.ts'

/** Chemin absolu d'un fichier de `examples/`. */
export function examplePath(name: string): string {
  return fileURLToPath(new URL(`../examples/${name}`, import.meta.url))
}

type Fixtures = { examiner: ExaminerPage }

export { expect } from '@playwright/test'

/**
 * `examiner` : écran examinateur d'une session neuve, créée depuis `examples/`. Playwright ouvre un
 * contexte de navigateur neuf par test, donc l'IndexedDB est vide au départ.
 */
export const test = base.extend<Fixtures>({
  examiner: async ({ page }, use) => {
    const home = new HomePage(page)
    await home.goto()
    const create = await home.createSession()
    await create.uploadStudents(examplePath('students.example.csv'))
    await create.uploadConfig(examplePath('config.example.json'))
    await create.fillName('Session e2e')
    await use(await create.submit())
  },
})
