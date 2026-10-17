import { readFileSync, writeFileSync } from 'node:fs'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

// Grande grille projetée (F44.7, D74) : 13 catégories donnent trois lignes de 5 + 4 + 4 tuiles.
const LONG_LABEL = 'Algorithmique_avancée_et_complexité'

test('vue projetée à 1280 × 800 : 13 catégories et un libellé long tiennent dans l’écran', async ({
  page,
}, testInfo) => {
  const config = JSON.parse(readFileSync(examplePath('config.example.json'), 'utf8'))
  const [model] = config.categories
  config.categories = Array.from({ length: 13 }, (_, i) => ({
    ...model,
    id: `c${i + 1}`,
    label: i === 12 ? LONG_LABEL : `Catégorie ${i + 1}`,
    questions: model.questions.map((question: { id: string }) => ({
      ...question,
      id: `c${i + 1}-${question.id}`,
    })),
  }))
  const path = testInfo.outputPath('thirteen.config.json')
  writeFileSync(path, JSON.stringify(config))

  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(path)
  await create.fillName('Treize catégories')
  const examiner = await create.submit()
  const present = await examiner.openPresentView()
  await present.page.setViewportSize({ width: 1280, height: 800 })
  await examiner.projectActiveStudent()

  const last = present.page.locator('[data-state]').last()
  await expect(last).toContainText(LONG_LABEL)
  await expect(last).toBeInViewport({ ratio: 1 })
  const overflow = await last.evaluate((tile) => {
    const box = tile.getBoundingClientRect()
    return Math.max(
      0,
      ...[...tile.querySelectorAll('*')].map((el) => el.getBoundingClientRect().right - box.right),
    )
  })
  expect(overflow).toBeLessThanOrEqual(0)
})
