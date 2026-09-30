import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

const phpConfig = fileURLToPath(new URL('./fixtures/offline-php.config.json', import.meta.url))

test('réseau coupé après un premier chargement : créer, faire passer, projeter, exporter', async ({
  page,
  context,
}) => {
  // 1. Premier chargement en ligne ; le service worker doit contrôler la page sans rechargement
  // (c'est ce qui vérifie `clientsClaim`).
  const home = new HomePage(page)
  await home.goto()
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready
    return navigator.serviceWorker.controller !== null
  })

  // 2. Plus de réseau : tout doit sortir du pré-cache.
  await context.setOffline(true)

  // 3. Création de session.
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(phpConfig)
  await create.fillName('Session hors ligne')
  const examiner = await create.submit()

  // 4. Vue projetée, puis passage du premier étudiant.
  const present = await examiner.openPresentView()
  await examiner.projectActiveStudent()
  await expect(present.studentName('Alice Durand')).toBeVisible()
  for (const category of ['Facile', 'Normal', 'Difficile']) {
    await examiner.draw(category)
    await expect(examiner.highlightedCode).toBeAttached()
    await expect(present.prompt).toBeVisible()
    await expect(present.highlightedCode).toBeAttached()
    await examiner.score('1')
  }
  await examiner.confirmAdjustment()

  // 5. Statistiques.
  const stats = await examiner.openStats()
  await expect(stats.histogram).toBeAttached()
  await expect(stats.headcount('Terminés')).toHaveText('1')
  await stats.backToPassage()

  // 6. Export Excel.
  const download = await examiner.exportWorkbook()
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/)
  const bytes = await readFile(await download.path())
  expect(bytes.subarray(0, 2).toString('latin1')).toBe('PK')
})

test('le manifeste et ses icônes sont servis', async ({ page, request }) => {
  await new HomePage(page).goto()
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).not.toBeNull()
  const manifestUrl = new URL(href ?? '', page.url()).toString()

  const response = await request.get(manifestUrl)
  expect(response.status()).toBe(200)
  const manifest: { display: string; icons: { src: string }[] } = await response.json()
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.length).toBeGreaterThan(0)
  for (const icon of manifest.icons) {
    const icoResponse = await request.get(new URL(icon.src, manifestUrl).toString())
    expect(icoResponse.status(), icon.src).toBe(200)
  }
})
