import { readFile } from 'node:fs/promises'
import { expect, test } from './fixtures.ts'

const pad = (n: number) => String(n).padStart(2, '0')

/** Date locale du jour au format `AAAA-MM-JJ`, comme le nom de fichier de l'export. */
function localDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

test('l’export Excel télécharge un classeur xlsx nommé d’après la session', async ({
  examiner,
}) => {
  // 1. Passage complet du premier étudiant : trois questions tirées puis notées.
  for (const category of ['Facile', 'Normal', 'Difficile']) {
    await examiner.draw(category)
    await examiner.score('1')
  }
  await examiner.confirmAdjustment()

  // 2. Export depuis l'onglet « Étudiants ».
  const download = await examiner.exportWorkbook()
  expect(download.suggestedFilename()).toBe(`session-e2e-${localDate()}.xlsx`)

  // 3. Un .xlsx est une archive zip : signature « PK ».
  const bytes = await readFile(await download.path())
  expect(bytes.subarray(0, 2).toString('latin1')).toBe('PK')
})
