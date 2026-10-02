import type { Locator } from '@playwright/test'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

// Sans espace ni tiret : aucun point de coupure, le cas le plus dur pour le titre.
const LONG_NAME = 'Oral_de_rattrapage_du_module_architecture_logicielle_groupe_B_2026'

const BUTTONS = ["Exporter un backup d'abord", 'Annuler', 'Supprimer']

/** Boîtes de la modale et de ses trois boutons, dans l'ordre d'affichage. */
async function boxes(dialog: Locator) {
  const frame = await dialog.boundingBox()
  const buttons = await Promise.all(
    BUTTONS.map((name) => dialog.getByRole('button', { name }).boundingBox()),
  )
  const [exportFirst, cancel, confirm] = buttons
  if (frame === null || exportFirst == null || cancel == null || confirm == null) {
    throw new Error('élément non affiché')
  }
  return { frame, exportFirst, cancel, confirm }
}

for (const { label, width, row } of [
  { label: 'bureau', width: 1280, row: true },
  { label: 'tablette', width: 700, row: true },
  { label: 'mobile', width: 375, row: false },
]) {
  test(`la modale de suppression contient ses trois boutons (${label})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    const home = new HomePage(page)
    await home.goto()
    const create = await home.createSession()
    await create.uploadStudents(examplePath('students.example.csv'))
    await create.uploadConfig(examplePath('config.example.json'))
    await create.fillName(LONG_NAME)
    await create.submit()
    await home.goto()

    const dialog = await home.openDeleteDialog(LONG_NAME)
    await expect(dialog).toBeVisible()
    const { frame, exportFirst, cancel, confirm } = await boxes(dialog)
    const buttons = [exportFirst, cancel, confirm]

    // Ni la modale ni ses boutons ne sortent de l'écran ou du cadre.
    expect(frame.x).toBeGreaterThanOrEqual(0)
    expect(frame.x + frame.width).toBeLessThanOrEqual(width)
    for (const box of buttons) {
      expect(box.x).toBeGreaterThanOrEqual(frame.x)
      expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width)
    }
    // Le titre long revient à la ligne au lieu de déborder.
    const title = dialog.getByRole('heading')
    const overflow = await title.evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)

    const tops = new Set(buttons.map((box) => Math.round(box.y)))
    expect(tops.size).toBe(row ? 1 : 3)
    // Sur une ligne, l'action destructive est à droite.
    if (row) expect(confirm.x).toBeGreaterThan(cancel.x)
  })
}
